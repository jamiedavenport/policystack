/**
 * Augmented by `openpolicy.gen.ts` — the on-disk module `@openpolicy/vite`
 * emits next to your `openpolicy.ts` (meant to be committed) — with one key
 * per scanned `collecting()` category. `defineConfig` reads this interface to
 * require a `data.context` entry (with `purpose`, `lawfulBasis`, `retention`,
 * and `provision`) for every scanned key.
 *
 * The scanned *values* (`dataCollected`, `thirdParties`, `cookies`,
 * `sharing`) are no longer exported from `@openpolicy/sdk`; import them
 * explicitly from your generated `./openpolicy.gen` module instead.
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

/**
 * Augmented by `openpolicy.gen.ts` (emitted by `@openpolicy/vite` alongside
 * your config, meant to be committed) with one key per scanned `sharing()`
 * data category — the personal-data categories that *leave* to a third party.
 * It is a typed seam: the §4.3 declared-vs-used cross-check keys off it to
 * verify every shared category is also declared. The full
 * (`key` → `recipient`) edges are carried by the generated `sharing` value
 * export.
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmented by codegen
export interface ScannedSharingKeys {}
