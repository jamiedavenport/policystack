import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type GA4Options = {
	measurementId: string;
	config?: Record<string, unknown>;
	requires?: ConsentExpr;
	id?: string;
};

export function ga4(opts: GA4Options): ScriptDefinition {
	const { measurementId, config, requires = "analytics", id = "ga4" } = opts;
	return defineScript({
		id,
		requires,
		src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
		queue: ["dataLayer.push", "gtag"],
		init: () => {
			const win = window as unknown as {
				dataLayer: unknown[];
				gtag: (...args: unknown[]) => void;
			};
			win.dataLayer = win.dataLayer || [];
			win.gtag = function gtag(...args: unknown[]) {
				win.dataLayer.push(args);
			};
			win.gtag("js", new Date());
			if (config) {
				win.gtag("config", measurementId, config);
			} else {
				win.gtag("config", measurementId);
			}
		},
	});
}
