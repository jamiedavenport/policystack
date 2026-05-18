import type { ConsentStore, GateOptions, ScriptDefinition, ScriptEvent } from "./types";

type Win = Window & Record<string, unknown>;
type QueuedCall = { path: string; args: unknown[]; forwarded: boolean };
type StubRecord = { path: string; original: unknown; existed: boolean };

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
	let unsubscribe: (() => void) | null = null;
	let loaded = false;
	let disposed = false;

	function emit(event: ScriptEvent): void {
		onEvent?.(event);
	}

	function onCall(call: QueuedCall): void {
		if (loaded) return;
		queuedCalls.push(call);
		emit({ type: "script:queued", id: def.id, path: call.path, args: call.args });
	}

	function installStubs(): void {
		for (const path of def.queue ?? []) stubs.push(installStub(win, path, onCall));
	}

	function restoreStubs(): void {
		for (const stub of stubs) restoreStub(win, stub);
		stubs = [];
	}

	async function load(): Promise<void> {
		if (loaded) return;
		loaded = true;
		try {
			if (def.src) await injectScript(doc, def.src, def.attrs);
		} catch (err) {
			console.warn(`[policystack] failed to load script "${def.id}":`, err);
			return;
		}
		def.init?.();
		replayQueued(win, queuedCalls);
		emit({ type: "script:loaded", id: def.id });
	}

	if (store.has(def.requires)) {
		void load();
	} else {
		emit({ type: "script:gated", id: def.id });
		installStubs();
		unsubscribe = store.subscribe(() => {
			if (disposed || loaded) return;
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

function installStub(win: Win, path: string, onCall: (call: QueuedCall) => void): StubRecord {
	const segments = path.split(".");
	const leaf = segments.pop();
	if (!leaf) throw new Error(`[policystack] invalid queue path: "${path}"`);

	let parent: Record<string, unknown> = win as unknown as Record<string, unknown>;
	for (const seg of segments) {
		if (parent[seg] === undefined || parent[seg] === null) {
			parent[seg] = seg === "dataLayer" ? [] : {};
		}
		parent = parent[seg] as Record<string, unknown>;
	}

	const existed = Object.prototype.hasOwnProperty.call(parent, leaf);
	const original = parent[leaf];
	const isArrayMethod = Array.isArray(parent) && (leaf === "push" || leaf === "unshift");

	const stub = (...args: unknown[]): unknown => {
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
	const segments = stub.path.split(".");
	const leaf = segments.pop();
	if (!leaf) return;
	let parent: Record<string, unknown> | undefined = win as unknown as Record<string, unknown>;
	for (const seg of segments) {
		if (!parent) return;
		parent = parent[seg] as Record<string, unknown> | undefined;
	}
	if (!parent) return;
	if (stub.existed) {
		parent[leaf] = stub.original;
	} else {
		delete parent[leaf];
	}
}

function replayQueued(win: Win, queued: QueuedCall[]): void {
	for (const call of queued) {
		if (call.forwarded) continue;
		const segments = call.path.split(".");
		const leaf = segments.pop();
		if (!leaf) continue;
		let parent: Record<string, unknown> | undefined = win as unknown as Record<string, unknown>;
		for (const seg of segments) {
			if (!parent) break;
			parent = parent[seg] as Record<string, unknown> | undefined;
		}
		const fn = parent?.[leaf];
		if (typeof fn === "function") {
			(fn as (...args: unknown[]) => unknown).apply(parent, call.args);
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
