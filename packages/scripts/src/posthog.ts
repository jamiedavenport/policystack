import { defineScript } from "@policystack/core/consent";
import type { ConsentExpr, ScriptDefinition } from "@policystack/core/consent";

export type PostHogOptions = {
	apiKey: string;
	apiHost?: string;
	options?: Record<string, unknown>;
	requires?: ConsentExpr;
	id?: string;
};

type QueueTarget = Record<string, unknown> & { push(item: unknown[]): unknown };

type PostHogStub = QueueTarget & {
	__SV?: number;
	_i?: [string, Record<string, unknown> | undefined, string][];
	init?: (key: string, config?: Record<string, unknown>, name?: string) => void;
	people?: QueueTarget;
};

const STUB_METHODS = [
	"capture",
	"identify",
	"alias",
	"set",
	"set_once",
	"reset",
	"group",
	"register",
	"register_once",
	"unregister",
	"opt_in_capturing",
	"opt_out_capturing",
	"has_opted_in_capturing",
	"has_opted_out_capturing",
	"get_distinct_id",
	"onFeatureFlags",
	"isFeatureEnabled",
	"getFeatureFlag",
	"getFeatureFlagPayload",
	"reloadFeatureFlags",
	"people.set",
	"people.set_once",
];

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
		// The official snippet's stub, minus the script injection (gateScript
		// injects `src`): an array decorated with method stubs that queue
		// [method, ...args] entries, and an `_i` register that array.js reads
		// for init calls — both must exist before the script loads.
		init: () => {
			const win = window as unknown as { posthog?: PostHogStub };
			const ph = (win.posthog ?? []) as unknown as PostHogStub;
			if (!ph.__SV) {
				win.posthog = ph;
				ph._i = [];
				ph.people = (ph.people ?? []) as unknown as QueueTarget;
				for (const method of STUB_METHODS) {
					const segments = method.split(".");
					const target = (segments.length === 2 ? ph[segments[0]!] : ph) as QueueTarget;
					const name = segments[segments.length - 1]!;
					target[name] = (...args: unknown[]) => target.push([name, ...args]);
				}
				ph.init = (key, config, name = "posthog") => {
					ph._i?.push([key, config, name]);
				};
				ph.__SV = 1;
			}
			ph.init?.(apiKey, { api_host: apiHost, ...options });
		},
	});
}
