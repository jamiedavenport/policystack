import type { ConsentModel } from "../jurisdiction-id";
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
	applicableJurisdictions?: Jurisdiction[] | "all";
	signal?: boolean;
};

export type Jurisdiction = "EEA" | "UK" | "CH" | "US" | `US-${string}` | "BR" | "CA" | "AU" | "ROW";

export type ResolverContext = Request | { headers: Headers };

export type JurisdictionResolver = {
	resolve(req?: ResolverContext): Promise<Jurisdiction | null> | Jurisdiction | null;
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
	jurisdiction: Jurisdiction | null;
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

export type ConsentRecordSource = "banner" | "preferences" | "api" | "import";

export type ConsentRecord = {
	schemaVersion: 1;
	decisions: Record<string, boolean>;
	policyVersion: string;
	decidedAt: string;
	jurisdiction: Jurisdiction | null;
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

// Runtime-only consent knobs toPolicyStackConsentConfig() CANNOT derive from the
// policy. Everything else in PolicyStackConsentConfig (categories, policyVersion,
// locale, canWithdraw) is derived from the PolicyStackConfig. This is the only
// consent surface a user authors by hand, and it lives under
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
	toggle(category: string, opts?: ActionOptions): void;
	save(opts?: ActionOptions): void;
	setRoute(route: Route): void;
	has(expr: ConsentExpr): boolean;
	refreshJurisdiction(req?: ResolverContext): Promise<Jurisdiction | null>;
};

export type ScriptDefinition = {
	id: string;
	requires: ConsentExpr;
	src?: string;
	attrs?: Record<string, string>;
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
