/**
 * Marks personal data **leaving** to a third party, at the exact point it
 * leaves. Returns `value` unchanged at runtime — the Vite plugin / CLI static
 * analyser scans `sharing()` calls at build time and records the
 * (`key` → `recipient`) edge.
 *
 * This is the data-flow **edge**, not a vendor declaration. It is deliberately
 * distinct from {@link thirdParty}:
 *
 *   - `thirdParty(name, purpose, policyUrl)` declares that a vendor *exists*
 *     in your stack and why — the static "who we work with" recipient list.
 *     It says nothing about which personal data actually reaches that vendor.
 *   - `sharing(key, recipient, value)` records that a specific category of
 *     personal data (`key`) is actually disclosed to `recipient` on *this*
 *     code path. Its presence is the CCPA/CPRA "sell/share" signal: a vendor
 *     in your `thirdParty()` list may be a pure processor and receive no
 *     personal data, so vendor existence alone cannot prove a sale or share.
 *
 * Place it at the egress point — wrap the outbound payload — not at module
 * scope. `key` is the data category being shared (it should match a
 * `collecting()` category); `recipient` is the third party (it should match a
 * `thirdParty()` name). Both must be **string literals** — dynamic values are
 * silently skipped by the analyser. `value` is returned untouched and is never
 * read at build time.
 *
 * @example
 * ```ts
 * import { sharing } from "@openpolicy/sdk";
 *
 * export async function reportPurchase(email: string, amountCents: number) {
 *   return fetch("https://api.stripe.com/v1/charges", {
 *     method: "POST",
 *     body: JSON.stringify(
 *       sharing("Account Information", "Stripe", { email, amountCents }),
 *     ),
 *   });
 * }
 * ```
 */
export function sharing<T>(_key: string, _recipient: string, value: T): T {
	return value;
}
