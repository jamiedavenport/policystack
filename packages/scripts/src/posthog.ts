import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type PostHogOptions = {
	apiKey: string;
	apiHost?: string;
	options?: Record<string, unknown>;
	requires?: ConsentExpr;
	id?: string;
};

export function posthog(opts: PostHogOptions): ScriptDefinition {
	const {
		apiKey,
		apiHost = "https://us.i.posthog.com",
		options,
		requires = "analytics",
		id = "posthog",
	} = opts;
	return defineScript({
		id,
		requires,
		src: `${apiHost}/static/array.js`,
		queue: [
			"posthog.capture",
			"posthog.identify",
			"posthog.alias",
			"posthog.set",
			"posthog.reset",
			"posthog.group",
		],
		init: () => {
			const ph = (
				window as unknown as {
					posthog: { init: (key: string, opts: Record<string, unknown>) => void };
				}
			).posthog;
			ph.init(apiKey, { api_host: apiHost, ...options });
		},
	});
}
