/**
 * DEMONSTRATION MODE
 *
 * This build has no server, so the seeded demo organisations and the one-click demo sign-in buttons exist only
 * to let the platform be shown end to end. They are ON by default for the hackathon build and must be switched
 * off for any real deployment: set VITE_DEMO_MODE=false. With demo mode off, no accounts are seeded, the
 * one-click demo buttons are hidden and the role switcher is disabled.
 *
 * The demo password is the same for every demo account, is not a secret and is not tied to any real person.
 * Override it with VITE_DEMO_PASSWORD. Real credentials must never be added to the source.
 */
type Env = Record<string, string | undefined>;
// Vite injects import.meta.env in the browser build. A Node process (the API server, the tests) has process.env.
declare const process: { env?: Env } | undefined;
const viteEnv: Env = (import.meta as unknown as { env?: Env }).env || {};
const nodeEnv: Env = (typeof process !== 'undefined' && process?.env) || {};
const env: Env = { ...nodeEnv, ...viteEnv };

export const DEMO_MODE: boolean = env.VITE_DEMO_MODE !== 'false';
export const DEMO_PASSWORD: string = env.VITE_DEMO_PASSWORD || 'Demo@2026!';
export const DEMO_DSAC_ADMIN_EMAIL = 'demo.admin@dsac.example';
