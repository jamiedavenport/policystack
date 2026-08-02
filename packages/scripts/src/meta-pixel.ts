import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type MetaPixelOptions = {
	pixelId: string;
	requires?: ConsentExpr;
	id?: string;
};

type FbqStub = {
	(...args: unknown[]): void;
	callMethod?: (...args: unknown[]) => void;
	queue: unknown[][];
	push: FbqStub;
	loaded: boolean;
	version: string;
};

export function metaPixel(opts: MetaPixelOptions): ScriptDefinition {
	const { pixelId, requires = "marketing", id = "meta-pixel" } = opts;
	return defineScript({
		id,
		requires,
		src: "https://connect.facebook.net/en_US/fbevents.js",
		queue: ["fbq"],
		// The official snippet's stub: fbevents.js decorates this function in
		// place (it never replaces window.fbq) and drains fbq.queue, so it must
		// exist — with init/PageView already queued — before the script loads.
		init: () => {
			const win = window as unknown as { fbq?: FbqStub; _fbq?: FbqStub };
			if (!win.fbq) {
				const fbq = ((...args: unknown[]) => {
					if (fbq.callMethod) fbq.callMethod(...args);
					else fbq.queue.push(args);
				}) as FbqStub;
				fbq.queue = [];
				fbq.push = fbq;
				fbq.loaded = true;
				fbq.version = "2.0";
				win.fbq = fbq;
				if (!win._fbq) win._fbq = fbq;
			}
			win.fbq("init", pixelId);
			win.fbq("track", "PageView");
		},
	});
}
