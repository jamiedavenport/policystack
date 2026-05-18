import { PolicyStackConsentError } from "./errors";
import type { ConsentExpr, ConsentState, EvaluateOptions } from "./types";

export function evaluate(
	expr: ConsentExpr,
	state: ConsentState,
	options: EvaluateOptions = {},
): boolean {
	const lockedKeys = new Set<string>();
	const knownKeys = new Set<string>();
	for (const c of state.categories) {
		knownKeys.add(c.key);
		if (c.locked === true) lockedKeys.add(c.key);
	}
	const onUnknownCategory = options.onUnknownCategory ?? "throw";

	function evalNode(node: ConsentExpr): boolean {
		if (typeof node === "string") {
			if (lockedKeys.has(node)) return true;
			if (!knownKeys.has(node)) {
				if (onUnknownCategory === "throw") {
					throw new PolicyStackConsentError("UNKNOWN_CATEGORY", `Unknown category: ${node}`);
				}
				if (onUnknownCategory === "warn") {
					console.warn(`[policystack] Unknown category: ${node}`);
				}
				return false;
			}
			return state.decisions[node] === true;
		}
		if ("and" in node) return node.and.every(evalNode);
		if ("or" in node) return node.or.some(evalNode);
		return !evalNode(node.not);
	}

	return evalNode(expr);
}
