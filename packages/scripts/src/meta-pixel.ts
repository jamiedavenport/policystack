import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type MetaPixelOptions = {
	pixelId: string;
	requires?: ConsentExpr;
	id?: string;
};

export function metaPixel(opts: MetaPixelOptions): ScriptDefinition {
	const { pixelId, requires = "marketing", id = "meta-pixel" } = opts;
	return defineScript({
		id,
		requires,
		src: "https://connect.facebook.net/en_US/fbevents.js",
		queue: ["fbq"],
		init: () => {
			const win = window as unknown as { fbq: (...args: unknown[]) => void };
			win.fbq("init", pixelId);
			win.fbq("track", "PageView");
		},
	});
}
