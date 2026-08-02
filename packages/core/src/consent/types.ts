import type { ConsentModel, JurisdictionId } from "../jurisdiction-id";
import type { LegalBasis } from "../types";

export type Route = "cookie" | "preferences" | "closed";

export type Category = {
	key: string;
	label: string;
	locked?: boolean;
	description?: string;
	respectGPC?: boolean;
	lawfulBasis?: LegalBasis;
	vendor?: string;
	purpose?: string;
};

export type ConsentSource = "default" | "user" | "gpc";

export type GPCConfig = {
	enabled?: boolean;
	applicableJurisdictions?: JurisdictionId[] | "all";
	signal?: boolean;
};

export type ResolverContext = Request | { headers: Headers };

export type JurisdictionResolver = {
	resolve(req?: ResolverContext): Promise<JurisdictionId | null> | JurisdictionId | null;
};

export type ConsentExpr =
	| string
	| { and: ConsentExpr[] }
	| { or: ConsentExpr[] }
	| { not: ConsentExpr };

export type UnknownCategoryBehavior = "throw" | "warn" | "silent";

export type EvaluateOptions = {
	onUnknownCategory?: UnknownCategoryBehavior;
};

export type ConsentState = {
	route: Route;
	categories: Category[];
	decisions: Record<string, boolean>;
	// Staged, unsaved preference edits: `toggle()` writes here; gating,
	// persistence, and gated scripts read `decisions` until `save()` promotes
	// the draft. Any route change not landing on "preferences" discards it.
	// Checkbox UIs render `(draft ?? decisions)[key]`.
	draft: Record<string, boolean> | null;
	jurisdiction: JurisdictionId | null;
	policyVersion: string;
	decidedAt: string | null;
	source: ConsentSource;
	repromptReason: RepromptReason | null;
	// Whether consent can be withdrawn/managed after the initial decision —
	// derived from `consentMechanism.canWithdraw` by the §4.1 bridge. UI
	// adapters read this to decide whether to surface a preferences-route
	// (withdraw/manage) affordance.
	canWithdraw: boolean;
	// Resolved §4.2 posture for the current jurisdiction, read from the same
	// JURISDICTION_TABLE as the policy text so prose and banner provably
	// agree. UI adapters render an opt-out "Do Not Sell/Share" affordance vs
	// an opt-in consent prompt off this; the route stays "cookie" in both.
	consentModel: ConsentModel;
};

export type RepromptReason = "policyVersion" | "categoriesAdded" | "expired" | "jurisdiction";

export type RepromptTriggers = {
	policyVersionChanged?: boolean;
	categoriesAdded?: boolean;
	expiresAfter?: number | string | null;
	jurisdictionChanged?: boolean;
};

export type RepromptEventDetail = { reason: RepromptReason };

export type ConsentRecordSource = "banner" | "preferences" | "api" | "import" | "signup";

export type ConsentRecord = {
	schemaVersion: 1;
	decisions: Record<string, boolean>;
	policyVersion: string;
	decidedAt: string;
	jurisdiction: JurisdictionId | null;
	locale: string;
	source: ConsentRecordSource;
};

export type StorageAdapter = {
	read(): Promise<ConsentRecord | null> | ConsentRecord | null;
	write(record: ConsentRecord): Promise<void> | void;
	clear(): Promise<void> | void;
	subscribe?(listener: (record: ConsentRecord | null) => void): () => void;
};

export type PolicyStackConsentConfig = {
	categories: Category[];
	policyVersion?: string;
	locale?: string;
	initialRoute?: Route;
	onUnknownCategory?: UnknownCategoryBehavior;
	jurisdictionResolver?: JurisdictionResolver;
	request?: ResolverContext;
	gpc?: GPCConfig;
	adapter?: StorageAdapter;
	triggers?: RepromptTriggers;
	canWithdraw?: boolean;
};

// Runtime-only consent knobs that CANNOT be derived from the policy. Everything
// else in PolicyStackConsentConfig (categories, policyVersion, locale,
// canWithdraw) is derived from the PolicyStackConfig by createConsentStore.
// This is the only consent surface a user authors by hand, and it lives under
// PolicyStackConfig.consent so policy + consent are ONE config. Pick<> keeps it
// structurally locked to PolicyStackConsentConfig — change a knob there, this follows.
export type PolicyStackConsentOptions = Pick<
	PolicyStackConsentConfig,
	| "adapter"
	| "jurisdictionResolver"
	| "request"
	| "gpc"
	| "initialRoute"
	| "triggers"
	| "onUnknownCategory"
>;

export type ActionOptions = {
	source?: ConsentRecordSource;
};

export type ConsentStore = {
	getState(): ConsentState;
	getConsentRecord(): ConsentRecord | null;
	getPreviousRecord(): ConsentRecord | null;
	subscribe(listener: (state: ConsentState) => void): () => void;
	acceptAll(opts?: ActionOptions): void;
	acceptNecessary(opts?: ActionOptions): void;
	reject(opts?: ActionOptions): void;
	// Stages the flip in `state.draft`; the record source is named at `save()`.
	toggle(category: string): void;
	save(opts?: ActionOptions): void;
	setRoute(route: Route): void;
	has(expr: ConsentExpr): boolean;
	refreshJurisdiction(req?: ResolverContext): Promise<JurisdictionId | null>;
	server: ServerSnapshot;
};

/**
 * The SSR seam. Live state varies with the environment — a server finds no
 * stored record and a timezone resolver reads the *host's* zone — so rendering
 * from it on the server mismatches the client that hydrates.
 *
 * These read the deterministic pre-consent view instead: undecided, no
 * jurisdiction, conservative opt-in, from static config only. Two stores built
 * from one config agree here whatever adapter or resolver they were given.
 *
 * `getState()` is frozen and referentially stable, as React's
 * `useSyncExternalStore` requires of `getServerSnapshot`.
 */
export type ServerSnapshot = {
	getState(): ConsentState;
	has(expr: ConsentExpr): boolean;
};

export type ScriptDefinition = {
	id: string;
	requires: ConsentExpr;
	src?: string;
	attrs?: Record<string, string>;
	/**
	 * The vendor's inline snippet bootstrap. Runs at consent time, BEFORE the
	 * script is injected — mirror the official snippet: create the vendor's own
	 * queueing stub (e.g. the `fbq` function with `.queue`, the `dataLayer`
	 * array) and make the initial calls (`fbq("init", …)`, `gtm.start`).
	 * Vendors like fbevents.js decorate the global that exists at load time and
	 * drain its queue, so the stub must exist before the script arrives.
	 * Queued pre-consent calls are replayed into it right after `init` returns.
	 */
	init?: () => void;
	queue?: string[];
};

export type ScriptEvent =
	| { type: "script:loaded"; id: string }
	| { type: "script:queued"; id: string; path: string; args: unknown[] }
	| { type: "script:gated"; id: string };

export type GateOptions = {
	document?: Document;
	window?: Window & Record<string, unknown>;
	onEvent?: (event: ScriptEvent) => void;
};
