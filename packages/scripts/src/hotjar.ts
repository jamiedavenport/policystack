import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type HotjarOptions = {
	siteId: number | string;
	version?: number;
	requires?: ConsentExpr;
	id?: string;
};

export function hotjar(opts: HotjarOptions): ScriptDefinition {
	const { siteId, version = 6, requires = "analytics", id = "hotjar" } = opts;
	return defineScript({
		id,
		requires,
		src: `https://static.hotjar.com/c/hotjar-${siteId}.js?sv=${version}`,
		queue: ["hj"],
		init: () => {
			const win = window as unknown as {
				_hjSettings: { hjid: number | string; hjsv: number };
			};
			win._hjSettings = { hjid: siteId, hjsv: version };
		},
	});
}
