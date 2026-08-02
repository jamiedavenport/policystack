import type { ConsentStore, GateOptions, ScriptDefinition, ScriptEvent } from "./types";

type Win = Window & Record<string, unknown>;
type QueuedCall = { path: string; args: unknown[]; forwarded: boolean };
type StubRecord = { path: string; original: unknown; existed: boolean };
type PathTarget = { parent: Record<string, unknown>; leaf: string };

const registered = new WeakMap<ConsentStore, Set<string>>();

export function defineScript(def: ScriptDefinition): ScriptDefinition {
	return def;
}

export function gateScript(
	store: ConsentStore,
	def: ScriptDefinition,
	opts?: GateOptions,
): () => void {
	const onEvent = opts?.onEvent;

	let ids = registered.get(store);
	if (!ids) {
		ids = new Set();
		registered.set(store, ids);
	}
	if (ids.has(def.id)) {
		console.warn(`[policystack] script "${def.id}" is already gated on this store`);
		return () => {};
	}
	ids.add(def.id);

	const env = resolveEnv(opts);
	if (!env) {
		onEvent?.({ type: "script:gated", id: def.id });
		return () => {
			ids.delete(def.id);
		};
	}
	const { win, doc } = env;

	const queuedCalls: QueuedCall[] = [];
	let stubs: StubRecord[] = [];
	const createdParents = new Set<string>();
	let unsubscribe: (() => void) | null = null;
	let started = false;
	let loaded = false;
	let disposed = false;

	function emit(event: ScriptEvent): void {
		onEvent?.(event);
	}

	function onCall(call: QueuedCall): void {
		queuedCalls.push(call);
		emit({ type: "script:queued", id: def.id, path: call.path, args: call.args });
	}

	function installStubs(): void {
		for (const path of def.queue ?? []) {
			stubs.push(installStub(win, path, onCall, () => started, createdParents));
		}
	}

	function restoreStubs(): void {
		for (const stub of stubs) restoreStub(win, stub);
		stubs = [];
		removeCreatedParents(win, createdParents);
	}

	async function load(): Promise<void> {
		if (started) return;
		started = true;
		// Official vendor snippet order: restore the pristine globals, run the
		// snippet bootstrap (`init`), replay the pre-consent queue into the
		// vendor's own stub, then inject the script. Vendors like fbevents.js
		// decorate whatever global exists at load time and drain its queue, so
		// the gate's stub must be gone — and the vendor's must exist — before
		// the script arrives. These three steps must stay synchronous.
		restoreStubs();
		def.init?.();
		replayQueued(win, queuedCalls);
		try {
			if (def.src) await injectScript(doc, def.src, def.attrs);
		} catch (err) {
			console.warn(`[policystack] failed to load script "${def.id}":`, err);
			return;
		}
		if (disposed) return;
		loaded = true;
		emit({ type: "script:loaded", id: def.id });
	}

	if (store.has(def.requires)) {
		void load();
	} else {
		emit({ type: "script:gated", id: def.id });
		installStubs();
		unsubscribe = store.subscribe(() => {
			if (disposed || started) return;
			if (!store.has(def.requires)) return;
			unsubscribe?.();
			unsubscribe = null;
			void load();
		});
	}

	return () => {
		if (disposed) return;
		disposed = true;
		unsubscribe?.();
		unsubscribe = null;
		if (!loaded) restoreStubs();
		ids.delete(def.id);
	};
}

export function gateScripts(
	store: ConsentStore,
	defs: ScriptDefinition[],
	opts?: GateOptions,
): () => void {
	const disposes = defs.map((d) => gateScript(store, d, opts));
	return () => {
		for (const d of disposes) d();
	};
}

function resolveEnv(opts?: GateOptions): { win: Win; doc: Document } | null {
	const win =
		opts && "window" in opts
			? opts.window
			: typeof window !== "undefined"
				? (window as unknown as Win)
				: undefined;
	const doc =
		opts && "document" in opts
			? opts.document
			: typeof document !== "undefined"
				? document
				: undefined;
	if (!win || !doc) return null;
	return { win, doc };
}

function resolvePath(win: Win, path: string): PathTarget | null {
	const segments = path.split(".");
	const leaf = segments.pop();
	if (!leaf) return null;
	let parent: Record<string, unknown> | undefined = win as unknown as Record<string, unknown>;
	for (const seg of segments) {
		if (!parent) return null;
		parent = parent[seg] as Record<string, unknown> | undefined;
	}
	if (!parent) return null;
	return { parent, leaf };
}

function installStub(
	win: Win,
	path: string,
	onCall: (call: QueuedCall) => void,
	isStarted: () => boolean,
	createdParents: Set<string>,
): StubRecord {
	const segments = path.split(".");
	const leaf = segments.pop();
	if (!leaf) throw new Error(`[policystack] invalid queue path: "${path}"`);

	let parent: Record<string, unknown> = win as unknown as Record<string, unknown>;
	const walked: string[] = [];
	for (const seg of segments) {
		walked.push(seg);
		if (parent[seg] === undefined || parent[seg] === null) {
			parent[seg] = seg === "dataLayer" ? [] : {};
			createdParents.add(walked.join("."));
		}
		parent = parent[seg] as Record<string, unknown>;
	}

	const existed = Object.prototype.hasOwnProperty.call(parent, leaf);
	const original = parent[leaf];
	const isArrayMethod = Array.isArray(parent) && (leaf === "push" || leaf === "unshift");

	const stub = (...args: unknown[]): unknown => {
		if (isStarted()) {
			// The hand-off already removed this stub from the window, but a
			// caller may hold a pre-consent reference to it — forward to
			// whatever lives at the path now instead of dropping the call.
			const target = resolvePath(win, path);
			if (target) {
				const fn = target.parent[target.leaf];
				if (typeof fn === "function" && fn !== stub) {
					return (fn as (...a: unknown[]) => unknown).apply(target.parent, args);
				}
			}
			return undefined;
		}
		onCall({ path, args, forwarded: isArrayMethod });
		if (isArrayMethod) {
			return Array.prototype[leaf as "push" | "unshift"].apply(
				parent as unknown as unknown[],
				args as never[],
			);
		}
		return undefined;
	};
	parent[leaf] = stub;

	return { path, original, existed };
}

function restoreStub(win: Win, stub: StubRecord): void {
	const target = resolvePath(win, stub.path);
	if (!target) return;
	if (stub.existed) {
		target.parent[target.leaf] = stub.original;
	} else {
		delete target.parent[target.leaf];
	}
}

// Removes intermediate objects that installStub created and that are still
// empty after the leaf stubs were restored (e.g. the `{}` behind
// `posthog.capture`), so `init` bootstraps like `window.analytics || []` see a
// clean slate. Created arrays are kept: pre-consent forwarded pushes — and any
// captured references — live in the array itself and must survive the hand-off.
function removeCreatedParents(win: Win, createdParents: Set<string>): void {
	const paths = [...createdParents].sort((a, b) => b.split(".").length - a.split(".").length);
	for (const path of paths) {
		const target = resolvePath(win, path);
		if (!target) continue;
		const value = target.parent[target.leaf];
		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			Object.keys(value).length === 0
		) {
			delete target.parent[target.leaf];
		}
	}
	createdParents.clear();
}

function replayQueued(win: Win, queued: QueuedCall[]): void {
	for (const call of queued) {
		if (call.forwarded) continue;
		const target = resolvePath(win, call.path);
		if (!target) continue;
		const fn = target.parent[target.leaf];
		if (typeof fn === "function") {
			(fn as (...args: unknown[]) => unknown).apply(target.parent, call.args);
		}
	}
}

function injectScript(
	doc: Document,
	src: string,
	attrs: Record<string, string> | undefined,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const el = doc.createElement("script");
		el.async = true;
		el.src = src;
		if (attrs) {
			for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
		}
		el.addEventListener("load", () => resolve(), { once: true });
		el.addEventListener("error", () => reject(new Error(`failed to load script: ${src}`)), {
			once: true,
		});
		(doc.head ?? doc.documentElement).appendChild(el);
	});
}
