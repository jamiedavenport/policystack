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

export function makeFakeDoc(onScriptLoad?: (script: FakeScript) => void): {
	doc: Document;
	scripts: FakeScript[];
} {
	const scripts: FakeScript[] = [];
	const head = {
		appendChild<T>(el: T): T {
			const fakeScript = el as unknown as FakeScript;
			const onLoad = fakeScript._onLoad;
			if (onLoad) {
				queueMicrotask(() => {
					onScriptLoad?.(fakeScript);
					onLoad();
				});
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
	return { doc: doc as unknown as Document, scripts };
}
