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
 * at runtime — the Vite plugin / CLI static analyser (OP-152) will scan calls
 * to `collecting()` at build time and merge the declarations into the
 * compiled privacy policy.
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
 * The category argument and the string values of the label record must be
 * string literals — dynamic values are silently skipped by the analyser.
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
