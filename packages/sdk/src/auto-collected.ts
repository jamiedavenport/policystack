/**
 * Augmented by `openpolicy.gen.ts` — the on-disk module `@openpolicy/vite`
 * emits next to your `openpolicy.ts` (meant to be committed) — with one key
 * per scanned `collecting()` category. `defineConfig` reads this interface to
 * require a `data.context` entry (with `purpose`, `lawfulBasis`, `retention`,
 * and `provision`) for every scanned key.
 *
 * The scanned *values* (`dataCollected`, `thirdParties`, `cookies`) are no
 * longer exported from `@openpolicy/sdk`; import them explicitly from your
 * generated `./openpolicy.gen` module instead.
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmented by codegen
export interface ScannedCollectionKeys {}

/**
 * Augmented by `openpolicy.gen.ts` (emitted by `@openpolicy/vite` alongside
 * your config, meant to be committed) with one key per scanned cookie
 * category. `defineConfig` reads this interface to require a
 * `cookies.context` entry for every scanned cookie category.
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmented by codegen
export interface ScannedCookieKeys {}
