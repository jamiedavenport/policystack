import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type HotjarOptions = {
	siteId: number | string;
	version?: number;
	requires?: ConsentExpr;
	id?: string;
};

type HjStub = {
	(...args: unknown[]): void;
	q?: unknown[][];
};

export function hotjar(opts: HotjarOptions): ScriptDefinition {
	const { siteId, version = 6, requires = "analytics", id = "hotjar" } = opts;
	return defineScript({
		id,
		requires,
		src: `https://static.hotjar.com/c/hotjar-${siteId}.js?sv=${version}`,
		queue: ["hj"],
		// The official snippet's stub: the hotjar script drains hj.q, so the
		// queueing hj function and _hjSettings must exist before it loads.
		init: () => {
			const win = window as unknown as {
				hj?: HjStub;
				_hjSettings: { hjid: number | string; hjsv: number };
			};
			if (!win.hj) {
				const hj = ((...args: unknown[]) => {
					(hj.q = hj.q ?? []).push(args);
				}) as HjStub;
				win.hj = hj;
			}
			win._hjSettings = { hjid: siteId, hjsv: version };
		},
	});
}
