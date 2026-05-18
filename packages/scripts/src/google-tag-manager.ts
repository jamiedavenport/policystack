import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type GoogleTagManagerOptions = {
	containerId: string;
	requires?: ConsentExpr;
	id?: string;
};

export function googleTagManager(opts: GoogleTagManagerOptions): ScriptDefinition {
	const { containerId, requires = "marketing", id = "google-tag-manager" } = opts;
	return defineScript({
		id,
		requires,
		src: `https://www.googletagmanager.com/gtm.js?id=${containerId}`,
		queue: ["dataLayer.push"],
		init: () => {
			const win = window as unknown as { dataLayer: unknown[] };
			win.dataLayer = win.dataLayer || [];
			win.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
		},
	});
}
