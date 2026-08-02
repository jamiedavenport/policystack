import { createConsentStore } from "@policystack/core/consent";
import type { Category, ConsentStore } from "@policystack/core/consent";

export const flushMicrotasks = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

export const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

export function makeStore(initialAccept: string[] = []): ConsentStore {
	const store = createConsentStore({
		categories: baseCategories,
		gpc: { enabled: false },
	});
	for (const k of initialAccept) store.toggle(k);
	if (initialAccept.length > 0) store.save();
	return store;
}

export type FakeScript = {
	tagName: string;
	async: boolean;
	src: string;
	attrs: Record<string, string>;
	_onLoad?: () => void;
	setAttribute(k: string, v: string): void;
	addEventListener(ev: string, cb: () => void, opts?: { once?: boolean }): void;
};

export function makeFakeDoc(
	onScriptLoad?: (script: FakeScript) => void,
	opts?: { manualLoad?: boolean },
): {
	doc: Document;
	scripts: FakeScript[];
	triggerLoad: () => void;
} {
	const scripts: FakeScript[] = [];
	const pending: FakeScript[] = [];
	const fire = (script: FakeScript): void => {
		onScriptLoad?.(script);
		script._onLoad?.();
	};
	const head = {
		appendChild<T>(el: T): T {
			const fakeScript = el as unknown as FakeScript;
			if (fakeScript._onLoad) {
				if (opts?.manualLoad) pending.push(fakeScript);
				else queueMicrotask(() => fire(fakeScript));
			}
			return el;
		},
	};
	const doc = {
		head,
		documentElement: head,
		createElement(tag: string): FakeScript {
			const el: FakeScript = {
				tagName: tag.toUpperCase(),
				async: false,
				src: "",
				attrs: {},
				setAttribute(k, v) {
					el.attrs[k] = v;
				},
				addEventListener(ev, cb) {
					if (ev === "load") el._onLoad = cb;
				},
			};
			scripts.push(el);
			return el;
		},
	};
	return {
		doc: doc as unknown as Document,
		scripts,
		triggerLoad: () => {
			for (const script of pending.splice(0)) fire(script);
		},
	};
}
