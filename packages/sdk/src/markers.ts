/**
 * Build-time **static-analysis markers**.
 *
 * Every function here has **no runtime effect** — `collecting()`/`sharing()`
 * return their `value` argument unchanged, `thirdParty()`/`defineCookie()` are
 * no-ops. They exist so the `@policystack/vite` plugin / CLI static analyser
 * (OP-152) can scan their call sites at build time and merge the declarations
 * into the compiled policy and the generated `policystack.gen` module.
 *
 * The string/object-literal arguments (`category`, `key`, `recipient`, `name`,
 * the label record) must be **literals** — dynamic values are silently skipped
 * by the analyser.
 */

/**
 * Sentinel used as a label value to explicitly exclude a field from the
 * compiled privacy policy. Every key of the `value` passed to `collecting()`
 * must appear in the label record — pass `Ignore` for fields that should not
 * appear in the policy (e.g. `hashedPassword: Ignore`).
 *
 * It is a `unique symbol` so it cannot collide with a real label string and
 * so the type checker treats it nominally.
 */
export const Ignore: unique symbol = Symbol("@policystack/ignore");

/**
 * Declares data collected at the point of storage. Returns `value` unchanged
 * at runtime — the analyser merges the declaration into the compiled privacy
 * policy.
 *
 * The third argument is a plain object literal whose **keys** are field names
 * matching your stored value (for convenient access without a typed callback)
 * and whose **values** are the human-readable labels used in the compiled
 * policy. Only the string values are used by the analyser; the object is
 * never evaluated at runtime. This shape lets you:
 *   - keep `value` matching your ORM/table schema exactly,
 *   - describe fields with friendly labels for the policy,
 *   - exclude a field from the policy by setting its label to `Ignore`
 *     (imported from `@policystack/sdk`) — every key of `value` must appear
 *     in the label record, so e.g. `hashedPassword: Ignore` is how you hide
 *     a sensitive column.
 *
 * @example
 * ```ts
 * import { collecting, Ignore } from "@policystack/sdk";
 *
 * export async function createUser(
 *   name: string,
 *   email: string,
 *   hashedPassword: string,
 * ) {
 *   return db.insert(users).values(
 *     collecting(
 *       "Account Information",
 *       { name, email, hashedPassword }, // real ORM columns — returned unchanged
 *       { name: "Name", email: "Email address", hashedPassword: Ignore },
 *     ),
 *   );
 * }
 * ```
 */
export function collecting<T>(
	_category: string,
	value: T,
	_label: Record<keyof T, string | typeof Ignore>,
): T {
	return value;
}

/**
 * Marks personal data **leaving** to a third party, at the exact point it
 * leaves. Returns `value` unchanged at runtime — the analyser records the
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
 * `thirdParty()` name).
 *
 * @example
 * ```ts
 * import { sharing } from "@policystack/sdk";
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

/**
 * Declares that a third-party vendor exists in your stack and why — the static
 * "who we work with" recipient list. Place it next to the vendor's
 * initialisation. No-op at runtime; scanned at build time.
 */
export function thirdParty(_name: string, _purpose: string, _policyUrl: string): void {}

/**
 * Declares a consent category at its use site. No-op at runtime; scanned at
 * build time.
 */
export function defineCookie(_category: string): void {}
