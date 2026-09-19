import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { AuditLogEntry } from '../src/types';

/**
 * A tamper-EVIDENT record of the audit trail.
 *
 * Every audit entry the store produces is appended, once, to a separate file as a link:
 *   hash = SHA-256( seq | time | previous hash | the entry )
 * so changing, removing, reordering or inserting any earlier entry breaks every hash after it, and verify() says
 * where. verify() can also compare the chain with the live audit log, which catches an entry edited or deleted in
 * the working data after it was chained.
 *
 * What this does NOT give: protection against someone who can rewrite the whole chain file consistently. To close
 * that, record the head hash somewhere the operator cannot change (a signed e-mail, a printout, a second system) and
 * compare it later. That is why head() is exposed.
 */
export const GENESIS_HASH = '0'.repeat(64);

export interface ChainLink {
  seq: number;
  at: string;
  entry: AuditLogEntry;
  prevHash: string;
  hash: string;
}

export interface ChainVerification {
  ok: boolean;
  links: number;
  head: string;
  problems: string[];
}

/** JSON with sorted keys, so the same entry always hashes the same. */
export function canonicalJson(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
}

const linkHash = (seq: number, at: string, prevHash: string, entry: AuditLogEntry) =>
  crypto.createHash('sha256').update(`${seq}|${at}|${prevHash}|${canonicalJson(entry)}`).digest('hex');

export class AuditChain {
  private lastSeq = 0;
  private lastHash = GENESIS_HASH;
  private chained = new Set<string>();

  constructor(private readonly file: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file)) return;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const link = JSON.parse(line) as ChainLink;
        this.lastSeq = link.seq;
        this.lastHash = link.hash;
        this.chained.add(link.entry.id);
      } catch {
        /* verify() reports an unreadable line */
      }
    }
  }

  /** Chains every audit entry not yet chained, oldest first. Returns how many were added. */
  sync(logs: AuditLogEntry[]): number {
    // The store keeps its audit log newest-first.
    const fresh = logs.filter(l => !this.chained.has(l.id)).reverse();
    if (fresh.length === 0) return 0;

    let out = '';
    for (const entry of fresh) {
      const seq = this.lastSeq + 1;
      const at = new Date().toISOString();
      const hash = linkHash(seq, at, this.lastHash, entry);
      out += `${JSON.stringify({ seq, at, entry, prevHash: this.lastHash, hash } satisfies ChainLink)}\n`;
      this.lastSeq = seq;
      this.lastHash = hash;
      this.chained.add(entry.id);
    }
    fs.appendFileSync(this.file, out, 'utf8');
    return fresh.length;
  }

  head(): { seq: number; hash: string } {
    return { seq: this.lastSeq, hash: this.lastHash };
  }

  /** Re-reads the chain from disk and checks every link, and (optionally) that the live log still matches it. */
  verify(live?: AuditLogEntry[]): ChainVerification {
    const problems: string[] = [];
    let prev = GENESIS_HASH;
    let expectedSeq = 1;
    let links = 0;
    const chainedEntries = new Map<string, AuditLogEntry>();

    const lines = fs.existsSync(this.file) ? fs.readFileSync(this.file, 'utf8').split('\n').filter(l => l.trim()) : [];
    for (const [i, line] of lines.entries()) {
      let link: ChainLink;
      try {
        link = JSON.parse(line) as ChainLink;
      } catch {
        problems.push(`Line ${i + 1} of the chain is unreadable.`);
        break;
      }
      if (link.seq !== expectedSeq) {
        problems.push(`Sequence break at line ${i + 1}: expected ${expectedSeq}, found ${link.seq} (an entry was removed, added or reordered).`);
        break;
      }
      if (link.prevHash !== prev) {
        problems.push(`Chain break at entry ${link.seq}: it does not follow the previous entry.`);
        break;
      }
      if (link.hash !== linkHash(link.seq, link.at, link.prevHash, link.entry)) {
        problems.push(`Entry ${link.seq} was altered after it was recorded (its hash does not match its content).`);
        break;
      }
      chainedEntries.set(link.entry.id, link.entry);
      prev = link.hash;
      expectedSeq++;
      links++;
    }

    if (live && problems.length === 0) {
      const liveById = new Map(live.map(e => [e.id, e]));
      for (const [id, chained] of chainedEntries) {
        const current = liveById.get(id);
        if (!current) problems.push(`Audit entry ${id} was recorded but is missing from the live log (deleted).`);
        else if (canonicalJson(current) !== canonicalJson(chained)) problems.push(`Audit entry ${id} in the live log differs from what was recorded (edited).`);
        if (problems.length >= 20) break;
      }
    }

    return { ok: problems.length === 0, links, head: prev, problems };
  }
}
