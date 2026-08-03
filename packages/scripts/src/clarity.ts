import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type ClarityOptions = {
	projectId: string;
	requires?: ConsentExpr;
	id?: string;
	/**
	 * Value sent as `ad_Storage` in the queued `consentv2` call. Defaults to
	 * "denied": the gate only proves the `requires` expression (analytics by
	 * default), not ad consent. Set to "granted" when gating Clarity behind an
	 * expression that also covers advertising, e.g.
	 * `{ and: ["analytics", "marketing"] }`.
	 */
	adStorage?: "granted" | "denied";
};

type ClarityStub = {
	(...args: unknown[]): void;
	q?: unknown[][];
};

export function clarity(opts: ClarityOptions): ScriptDefinition {
	const { projectId, requires = "analytics", id = "clarity", adStorage = "denied" } = opts;
	return defineScript({
		id,
		requires,
		src: `https://www.clarity.ms/tag/${projectId}`,
		queue: ["clarity"],
		// The official snippet's stub: the clarity script drains clarity.q, so
		// the queueing clarity function must exist before it loads. Clarity
		// enforces consent signals for EEA/UK/CH traffic, so a consentv2 call is
		// queued first — analytics_Storage is granted because the gate only runs
		// init once `requires` is satisfied.
		init: () => {
			const win = window as unknown as { clarity?: ClarityStub };
			if (!win.clarity) {
				const stub = ((...args: unknown[]) => {
					(stub.q = stub.q ?? []).push(args);
				}) as ClarityStub;
				win.clarity = stub;
			}
			win.clarity("consentv2", {
				ad_Storage: adStorage,
				analytics_Storage: "granted",
			});
		},
	});
}
