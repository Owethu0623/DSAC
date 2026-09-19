import fs from 'node:fs';
import path from 'node:path';
import type { StorageAdapter } from '../src/services/storageAdapter';

/**
 * The store's key/value persistence, kept in one readable JSON file. Writes are batched and atomic (write a temp
 * file, then rename it over the real one) so a crash mid-write cannot leave a half-written data file.
 *
 * This is the simplest durable thing that works for one server process. It is an adapter: a database-backed
 * implementation of the same three methods replaces it without touching the store.
 */
export class FileStorage implements StorageAdapter {
  private data = new Map<string, unknown>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly file: string, private readonly debounceMs = 40) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
        for (const [key, value] of Object.entries(parsed)) this.data.set(key, value);
      } catch {
        // An unreadable data file is kept for inspection and the server starts from the baseline rather than crashing.
        fs.copyFileSync(file, `${file}.unreadable-${Date.now()}`);
      }
    }
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? JSON.stringify(this.data.get(key)) : null;
  }

  setItem(key: string, value: string): void {
    const parsed = JSON.parse(value) as unknown;
    if (JSON.stringify(this.data.get(key)) === value) return;
    this.data.set(key, parsed);
    this.schedule();
  }

  removeItem(key: string): void {
    if (this.data.delete(key)) this.schedule();
  }

  /** Writes any pending change now. Called on shutdown and by tests. */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(this.data)), 'utf8');
    fs.renameSync(tmp, this.file);
  }

  private schedule(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      try {
        this.flush();
      } catch (e) {
        console.error('Could not write the data file:', e);
      }
    }, this.debounceMs);
  }
}
