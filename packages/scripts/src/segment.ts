import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type SegmentOptions = {
	writeKey: string;
	requires?: ConsentExpr;
	id?: string;
};

type SegmentStub = unknown[] &
	Record<string, unknown> & {
		initialize?: unknown;
		invoked?: boolean;
	};

const STUB_METHODS = [
	"trackSubmit",
	"trackClick",
	"trackLink",
	"trackForm",
	"pageview",
	"identify",
	"reset",
	"group",
	"track",
	"ready",
	"alias",
	"debug",
	"page",
	"screen",
	"once",
	"off",
	"on",
	"addSourceMiddleware",
	"addIntegrationMiddleware",
	"setAnonymousId",
	"addDestinationMiddleware",
];

export function segment(opts: SegmentOptions): ScriptDefinition {
	const { writeKey, requires = "analytics", id = "segment" } = opts;
	return defineScript({
		id,
		requires,
		src: `https://cdn.segment.com/analytics.js/v1/${writeKey}/analytics.min.js`,
		queue: [
			"analytics.track",
			"analytics.page",
			"analytics.identify",
			"analytics.group",
			"analytics.alias",
			"analytics.reset",
		],
		// The official snippet's stub, minus the script injection (gateScript
		// injects `src`): analytics.min.js consumes window.analytics as an
		// array of queued [method, ...args] entries, so the array — with the
		// initial page() call queued — must exist before the script loads.
		init: () => {
			const win = window as unknown as { analytics?: SegmentStub };
			const analytics = (win.analytics = (win.analytics ?? []) as unknown as SegmentStub);
			if (!analytics.initialize && !analytics.invoked) {
				analytics.invoked = true;
				analytics.methods = STUB_METHODS;
				analytics.factory = (method: string) => {
					return (...args: unknown[]) => {
						analytics.push([method, ...args]);
						return analytics;
					};
				};
				for (const method of STUB_METHODS) {
					analytics[method] = (analytics.factory as (m: string) => unknown)(method);
				}
				analytics._writeKey = writeKey;
				analytics.SNIPPET_VERSION = "5.2.0";
			}
			(analytics.page as (...args: unknown[]) => unknown)();
		},
	});
}
