/**
 * Where the store keeps its data. By default that is the browser's localStorage when there is one, and nowhere
 * (memory only) otherwise, which is what the tests and a server process without an adapter get.
 *
 * Two other places use this seam:
 *  - the API server installs a file-backed adapter before it loads the store, so the same tested store runs there;
 *  - the browser in "connected" mode installs none, so the server's data is never copied into browser storage.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

// undefined = choose automatically; null = no persistence at all
let override: StorageAdapter | null | undefined;

export function setStorageAdapter(adapter: StorageAdapter | null | undefined): void {
  override = adapter;
}

export function getStorageAdapter(): StorageAdapter | null {
  if (override !== undefined) return override;
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage : null;
}
