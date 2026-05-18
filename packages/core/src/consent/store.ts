import { evaluate } from "./expr";
import { applyGPC } from "./gpc";
import { resolveLocale } from "./locale";
import { jurisdictionPosture, postureDecisions } from "./posture";
import { fromUnknown, recordEquals, toRecord } from "./storage/record";
import { evaluateTriggers } from "./triggers";
import type {
	ActionOptions,
	ConsentExpr,
	ConsentRecord,
	ConsentRecordSource,
	ConsentState,
	ConsentStore,
	Jurisdiction,
	PolicyStackConsentConfig,
	RepromptReason,
	ResolverContext,
	Route,
} from "./types";

type Listener = (state: ConsentState) => void;

export function createConsentStore(config: PolicyStackConsentConfig): ConsentStore {
	const listeners = new Set<Listener>();
	const locale = resolveLocale(config);

	const initialJurisdiction = resolveSync(config, config.request);
	const initialRecord = readSync(config, locale);

	const initialModel = jurisdictionPosture(initialJurisdiction.value);
	const baseState: ConsentState = {
		route: config.initialRoute ?? "cookie",
		categories: config.categories,
		decisions: postureDecisions(config.categories, initialModel),
		jurisdiction: initialJurisdiction.value,
		policyVersion: config.policyVersion ?? "",
		decidedAt: null,
		source: "default",
		repromptReason: null,
		canWithdraw: config.canWithdraw ?? false,
		consentModel: initialModel,
	};

	let state: ConsentState;
	let lastDecisionSource: ConsentRecordSource | null;
	let lastWritten: ConsentRecord | null = initialRecord.value;
	let previousRecord: ConsentRecord | null = null;
	let suspendWrite = false;
	let lastDispatchedReason: RepromptReason | null = null;

	if (initialRecord.value !== null) {
		const reason = checkTriggers(initialRecord.value, baseState.jurisdiction);
		if (reason !== null) {
			previousRecord = initialRecord.value;
			state = applyGPC({ ...baseState, repromptReason: reason }, config);
			lastDecisionSource = null;
		} else {
			state = applyGPC(mergeRecord(baseState, initialRecord.value), config);
			lastDecisionSource = initialRecord.value.source;
		}
	} else {
		state = applyGPC(baseState, config);
		lastDecisionSource = null;
	}
	maybeDispatchReprompt();

	if (initialRecord.pending) {
		void initialRecord.pending.then((record) => {
			if (record === null) return;
			handleIncomingRecord(record);
		});
	}

	if (initialJurisdiction.pending) {
		void initialJurisdiction.pending.then((value) => {
			handleJurisdictionChange(value);
		});
	}

	if (config.adapter?.subscribe) {
		config.adapter.subscribe((raw) => {
			const record = fromUnknown(raw, locale);
			if (record === null) return;
			handleIncomingRecord(record);
		});
	}

	function handleIncomingRecord(record: ConsentRecord): void {
		suspendWrite = true;
		const reason = checkTriggers(record, state.jurisdiction);
		if (reason !== null) {
			previousRecord = record;
			lastDecisionSource = null;
			lastWritten = record;
			commit(applyGPC(invalidate(state, reason), config));
		} else {
			lastDecisionSource = record.source;
			lastWritten = record;
			previousRecord = null;
			commit(applyGPC(mergeRecord(state, record), config));
		}
		suspendWrite = false;
	}

	function handleJurisdictionChange(value: Jurisdiction | null): void {
		const model = jurisdictionPosture(value);
		let next: ConsentState = { ...state, jurisdiction: value, consentModel: model };
		// While pristine (no user decision, no stored record, no pending
		// reprompt) re-default to the resolved jurisdiction's posture — this
		// closes the silent-opt-in footgun for async resolvers. applyGPC
		// re-runs at commit, so an opt-out default still composes with GPC.
		// A user decision or stored record is never overridden here.
		if (state.decidedAt === null && lastWritten === null && state.repromptReason === null) {
			next = { ...next, decisions: postureDecisions(next.categories, model) };
		}
		if (state.repromptReason === null && lastWritten !== null) {
			const reason = evaluateTriggers({
				record: lastWritten,
				triggers: config.triggers,
				policyVersion: config.policyVersion ?? "",
				categories: config.categories,
				jurisdiction: value,
				now: Date.now(),
			});
			if (reason !== null) {
				previousRecord = lastWritten;
				lastDecisionSource = null;
				next = invalidate(next, reason);
			}
		}
		commit(applyGPC(next, config));
	}

	function checkTriggers(
		record: ConsentRecord,
		jurisdiction: Jurisdiction | null,
	): RepromptReason | null {
		return evaluateTriggers({
			record,
			triggers: config.triggers,
			policyVersion: config.policyVersion ?? "",
			categories: config.categories,
			jurisdiction,
			now: Date.now(),
		});
	}

	function invalidate(current: ConsentState, reason: RepromptReason): ConsentState {
		// Re-default to the posture of where the visitor is *now* (current.jurisdiction
		// is already the post-change value on the jurisdiction-change path), so a
		// reprompt never falls back to stale opt-in.
		const model = jurisdictionPosture(current.jurisdiction);
		return {
			...current,
			decisions: postureDecisions(current.categories, model),
			decidedAt: null,
			route: "cookie",
			source: "default",
			repromptReason: reason,
			consentModel: model,
		};
	}

	function maybeDispatchReprompt(): void {
		if (state.repromptReason !== null && state.repromptReason !== lastDispatchedReason) {
			lastDispatchedReason = state.repromptReason;
			dispatchRepromptEvent(state.repromptReason);
		} else if (state.repromptReason === null) {
			lastDispatchedReason = null;
		}
	}

	function commit(next: ConsentState): void {
		state = next;
		for (const listener of listeners) listener(state);
		persist();
		maybeDispatchReprompt();
	}

	function persist(): void {
		if (!config.adapter || suspendWrite) return;
		if (state.decidedAt === null || lastDecisionSource === null) return;
		const record = toRecord(state, lastDecisionSource, locale);
		if (lastWritten && recordEquals(lastWritten, record)) return;
		lastWritten = record;
		try {
			const result = config.adapter.write(record);
			if (isPromise(result)) {
				result.catch((err) => {
					console.warn("[policystack] adapter.write failed:", err);
				});
			}
		} catch (err) {
			console.warn("[policystack] adapter.write failed:", err);
		}
	}

	function inferSource(routeBefore: Route, opts?: ActionOptions): ConsentRecordSource {
		if (opts?.source) return opts.source;
		return routeBefore === "preferences" ? "preferences" : "banner";
	}

	function decisionsAll(value: boolean): Record<string, boolean> {
		return Object.fromEntries(state.categories.map((c) => [c.key, value]));
	}

	function decisionsNecessary(): Record<string, boolean> {
		return Object.fromEntries(state.categories.map((c) => [c.key, c.locked === true]));
	}

	return {
		getState() {
			return state;
		},
		getConsentRecord() {
			if (state.decidedAt === null || lastDecisionSource === null) return null;
			return toRecord(state, lastDecisionSource, locale);
		},
		getPreviousRecord() {
			return previousRecord;
		},
		subscribe(listener: Listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		acceptAll(opts?: ActionOptions) {
			lastDecisionSource = inferSource(state.route, opts);
			previousRecord = null;
			commit({
				...state,
				decisions: decisionsAll(true),
				decidedAt: new Date().toISOString(),
				route: "closed",
				source: "user",
				repromptReason: null,
			});
		},
		acceptNecessary(opts?: ActionOptions) {
			lastDecisionSource = inferSource(state.route, opts);
			previousRecord = null;
			commit({
				...state,
				decisions: decisionsNecessary(),
				decidedAt: new Date().toISOString(),
				route: "closed",
				source: "user",
				repromptReason: null,
			});
		},
		reject(opts?: ActionOptions) {
			lastDecisionSource = inferSource(state.route, opts);
			previousRecord = null;
			commit({
				...state,
				decisions: decisionsNecessary(),
				decidedAt: new Date().toISOString(),
				route: "closed",
				source: "user",
				repromptReason: null,
			});
		},
		toggle(category: string, opts?: ActionOptions) {
			const cat = state.categories.find((c) => c.key === category);
			if (!cat || cat.locked === true) return;
			lastDecisionSource = inferSource(state.route, opts);
			commit({
				...state,
				decisions: {
					...state.decisions,
					[category]: !state.decisions[category],
				},
				source: "user",
			});
		},
		save(opts?: ActionOptions) {
			lastDecisionSource = inferSource(state.route, opts);
			previousRecord = null;
			commit({
				...state,
				decidedAt: new Date().toISOString(),
				route: "closed",
				source: "user",
				repromptReason: null,
			});
		},
		setRoute(route: Route) {
			if (state.route === route) return;
			commit({ ...state, route });
		},
		has(expr: ConsentExpr) {
			return evaluate(expr, state, {
				onUnknownCategory: config.onUnknownCategory,
			});
		},
		async refreshJurisdiction(req?: ResolverContext) {
			const resolver = config.jurisdictionResolver;
			if (!resolver) return state.jurisdiction;
			let raw: Promise<Jurisdiction | null> | Jurisdiction | null;
			try {
				raw = resolver.resolve(req ?? config.request);
			} catch (err) {
				warnResolverError(err);
				return state.jurisdiction;
			}
			const next = await safeResolve(raw);
			if (next.ok) handleJurisdictionChange(next.value);
			return state.jurisdiction;
		},
	};
}

function dispatchRepromptEvent(reason: RepromptReason): void {
	queueMicrotask(() => {
		try {
			const target = globalThis as { dispatchEvent?: (e: Event) => boolean };
			if (typeof CustomEvent !== "undefined" && typeof target.dispatchEvent === "function") {
				target.dispatchEvent(new CustomEvent("oncookies:reprompt", { detail: { reason } }));
			}
		} catch {
			// Best-effort: ignore environments without CustomEvent/dispatchEvent.
		}
	});
}

type InitialJurisdiction = {
	value: Jurisdiction | null;
	pending: Promise<Jurisdiction | null> | null;
};

function resolveSync(
	config: PolicyStackConsentConfig,
	req: ResolverContext | undefined,
): InitialJurisdiction {
	const resolver = config.jurisdictionResolver;
	if (!resolver) return { value: null, pending: null };

	let result: Promise<Jurisdiction | null> | Jurisdiction | null;
	try {
		result = resolver.resolve(req);
	} catch (err) {
		warnResolverError(err);
		return { value: null, pending: null };
	}

	if (isPromise(result)) {
		const pending = safeResolve(result).then((r) => (r.ok ? r.value : null));
		return { value: null, pending };
	}
	return { value: result, pending: null };
}

type ResolveOutcome = { ok: true; value: Jurisdiction | null } | { ok: false };

async function safeResolve(
	result: Promise<Jurisdiction | null> | Jurisdiction | null,
): Promise<ResolveOutcome> {
	try {
		const value = await result;
		return { ok: true, value };
	} catch (err) {
		warnResolverError(err);
		return { ok: false };
	}
}

function isPromise<T>(value: unknown): value is Promise<T> {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { then?: unknown }).then === "function"
	);
}

function warnResolverError(err: unknown): void {
	console.warn("[policystack] jurisdiction resolver failed:", err);
}

type InitialRecord = {
	value: ConsentRecord | null;
	pending: Promise<ConsentRecord | null> | null;
};

function readSync(config: PolicyStackConsentConfig, locale: string): InitialRecord {
	if (!config.adapter) return { value: null, pending: null };
	let result: Promise<ConsentRecord | null> | ConsentRecord | null;
	try {
		result = config.adapter.read();
	} catch (err) {
		console.warn("[policystack] adapter.read failed:", err);
		return { value: null, pending: null };
	}
	if (isPromise(result)) {
		const pending = result
			.then((raw) => fromUnknown(raw, locale))
			.catch((err) => {
				console.warn("[policystack] adapter.read failed:", err);
				return null;
			});
		return { value: null, pending };
	}
	return { value: fromUnknown(result, locale), pending: null };
}

function mergeRecord(state: ConsentState, record: ConsentRecord | null): ConsentState {
	if (!record) return state;
	const decisions: Record<string, boolean> = { ...state.decisions };
	for (const c of state.categories) {
		if (c.locked === true) {
			decisions[c.key] = true;
			continue;
		}
		if (Object.hasOwn(record.decisions, c.key)) {
			decisions[c.key] = record.decisions[c.key] === true;
		}
	}
	const jurisdiction = record.jurisdiction ?? state.jurisdiction;
	return {
		...state,
		decisions,
		jurisdiction,
		policyVersion: record.policyVersion || state.policyVersion,
		decidedAt: record.decidedAt,
		route: state.route === "cookie" ? "closed" : state.route,
		source: "user",
		repromptReason: null,
		// Decisions stay the user's; the UI hint still tracks the resolved
		// jurisdiction so the banner/preferences render the right affordance.
		consentModel: jurisdictionPosture(jurisdiction),
	};
}
