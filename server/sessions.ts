import crypto from 'node:crypto';

interface Session {
  userId: string;
  created: number;
  lastSeen: number;
}

/**
 * Server-side sessions. The browser holds only a random 256-bit token (in an HttpOnly cookie); the server keeps
 * a SHA-256 of it, so a memory dump or a log line cannot be replayed as a session. A session ends after an idle
 * period or an absolute lifetime, whichever comes first. Sessions live in memory, so a restart signs everyone out.
 */
export class Sessions {
  private readonly map = new Map<string, Session>();

  constructor(
    private readonly idleMs = 60 * 60 * 1000,
    private readonly absoluteMs = 8 * 60 * 60 * 1000
  ) {}

  private key(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  create(userId: string): string {
    const token = crypto.randomBytes(32).toString('base64url');
    const now = Date.now();
    this.map.set(this.key(token), { userId, created: now, lastSeen: now });
    return token;
  }

  /** The session for a token, or null if it is unknown or expired. A valid lookup renews the idle timer. */
  get(token: string | undefined): { userId: string } | null {
    if (!token) return null;
    const k = this.key(token);
    const session = this.map.get(k);
    if (!session) return null;
    const now = Date.now();
    if (now - session.lastSeen > this.idleMs || now - session.created > this.absoluteMs) {
      this.map.delete(k);
      return null;
    }
    session.lastSeen = now;
    return { userId: session.userId };
  }

  destroy(token: string | undefined): void {
    if (token) this.map.delete(this.key(token));
  }

  get size(): number {
    return this.map.size;
  }
}
