// @vitest-environment happy-dom
import { createConsentStore, type Category } from "@policystack/core/consent";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h } from "vue";
import {
	ConsentGate,
	PolicyStackConsentPlugin,
	PolicyStackConsentProvider,
	useCategory,
	useConsent,
} from "./consent";

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

afterEach(() => {
	vi.restoreAllMocks();
});

function withProvider(setupFn: () => unknown) {
	const Probe = defineComponent({ setup: setupFn, render: () => h("div") });
	return mount(Probe, {
		global: {
			plugins: [[PolicyStackConsentPlugin, { config: { categories: baseCategories } }]],
		},
	});
}

describe("PolicyStackConsentPlugin", () => {
	it("provides a store created from config", () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		withProvider(() => {
			captured = useConsent();
		});
		expect(captured?.route.value).toBe("cookie");
		expect(captured?.decisions.value).toEqual({
			essential: true,
			analytics: false,
			marketing: false,
		});
	});

	it("uses a pre-created store when provided", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.toggle("analytics");
		let captured: ReturnType<typeof useConsent> | undefined;
		const Probe = defineComponent({
			setup: () => {
				captured = useConsent();
			},
			render: () => h("div"),
		});
		mount(Probe, {
			global: { plugins: [[PolicyStackConsentPlugin, { store }]] },
		});
		expect(captured?.decisions.value.analytics).toBe(true);
	});
});

describe("PolicyStackConsentProvider", () => {
	it("provides a store via component scope", () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		const Inner = defineComponent({
			setup: () => {
				captured = useConsent();
			},
			render: () => h("div"),
		});
		mount(PolicyStackConsentProvider, {
			props: { config: { categories: baseCategories } },
			slots: { default: () => h(Inner) },
		});
		expect(captured?.route.value).toBe("cookie");
	});

	it("accepts an injected store", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.acceptAll();
		let captured: ReturnType<typeof useConsent> | undefined;
		const Inner = defineComponent({
			setup: () => {
				captured = useConsent();
			},
			render: () => h("div"),
		});
		mount(PolicyStackConsentProvider, {
			props: { store },
			slots: { default: () => h(Inner) },
		});
		expect(captured?.route.value).toBe("closed");
		expect(captured?.decisions.value.analytics).toBe(true);
	});

	it("throws when used outside any provider", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const Probe = defineComponent({
			setup: () => {
				useConsent();
			},
			render: () => h("div"),
		});
		expect(() => mount(Probe)).toThrow(/PolicyStackConsentProvider|PolicyStackConsentPlugin/);
	});
});

describe("useConsent", () => {
	it("re-renders consumers when state changes", async () => {
		const store = createConsentStore({ categories: baseCategories });
		let captured: ReturnType<typeof useConsent> | undefined;
		const Inner = defineComponent({
			setup: () => {
				captured = useConsent();
				return () => h("span", { "data-testid": "route" }, captured?.route.value);
			},
		});
		const wrapper = mount(PolicyStackConsentProvider, {
			props: { store },
			slots: { default: () => h(Inner) },
		});
		expect(wrapper.get('[data-testid="route"]').text()).toBe("cookie");

		captured?.acceptAll();
		await wrapper.vm.$nextTick();
		expect(captured?.route.value).toBe("closed");
		expect(captured?.decisions.value.analytics).toBe(true);
		expect(wrapper.get('[data-testid="route"]').text()).toBe("closed");
	});

	it("toggle and save flow works", async () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		const wrapper = withProvider(() => {
			captured = useConsent();
		});
		captured?.toggle("analytics");
		await wrapper.vm.$nextTick();
		expect(captured?.decisions.value.analytics).toBe(true);
		expect(captured?.decidedAt.value).toBeNull();
		captured?.save();
		await wrapper.vm.$nextTick();
		expect(captured?.decidedAt.value).not.toBeNull();
		expect(captured?.route.value).toBe("closed");
	});

	it("setRoute updates the route", async () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		const wrapper = withProvider(() => {
			captured = useConsent();
		});
		captured?.setRoute("preferences");
		await wrapper.vm.$nextTick();
		expect(captured?.route.value).toBe("preferences");
	});

	it("getConsentRecord returns null pre-decision and a v1 record after acceptAll", async () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		const wrapper = withProvider(() => {
			captured = useConsent();
		});
		expect(captured?.getConsentRecord()).toBeNull();
		captured?.acceptAll();
		await wrapper.vm.$nextTick();
		const record = captured?.getConsentRecord();
		expect(record).not.toBeNull();
		expect(record?.schemaVersion).toBe(1);
		expect(record?.source).toBe("banner");
	});
});

describe("useCategory", () => {
	it("returns granted false initially for non-locked categories", () => {
		let captured: ReturnType<typeof useCategory> | undefined;
		withProvider(() => {
			captured = useCategory("analytics");
		});
		expect(captured?.granted.value).toBe(false);
	});

	it("returns granted true for locked categories", () => {
		let captured: ReturnType<typeof useCategory> | undefined;
		withProvider(() => {
			captured = useCategory("essential");
		});
		expect(captured?.granted.value).toBe(true);
	});

	it("flips on toggle", async () => {
		let captured: ReturnType<typeof useCategory> | undefined;
		const wrapper = withProvider(() => {
			captured = useCategory("analytics");
		});
		captured?.toggle();
		await wrapper.vm.$nextTick();
		expect(captured?.granted.value).toBe(true);
	});
});

describe("ConsentGate", () => {
	it("renders default slot when expression is true", () => {
		const store = createConsentStore({ categories: baseCategories });
		store.acceptAll();
		const wrapper = mount(PolicyStackConsentProvider, {
			props: { store },
			slots: {
				default: () =>
					h(
						ConsentGate,
						{ requires: "analytics" },
						{
							default: () => h("span", { "data-testid": "child" }, "visible"),
						},
					),
			},
		});
		expect(wrapper.get('[data-testid="child"]').text()).toBe("visible");
	});

	it("renders fallback slot when expression is false", () => {
		const wrapper = mount(PolicyStackConsentProvider, {
			props: { config: { categories: baseCategories } },
			slots: {
				default: () =>
					h(
						ConsentGate,
						{ requires: "analytics" },
						{
							default: () => h("span", { "data-testid": "child" }, "visible"),
							fallback: () => h("span", { "data-testid": "fb" }, "nope"),
						},
					),
			},
		});
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		expect(wrapper.get('[data-testid="fb"]').text()).toBe("nope");
	});

	it("renders nothing when no fallback and gate is closed", () => {
		const wrapper = mount(PolicyStackConsentProvider, {
			props: { config: { categories: baseCategories } },
			slots: {
				default: () =>
					h(
						ConsentGate,
						{ requires: "analytics" },
						{
							default: () => h("span", { "data-testid": "child" }, "visible"),
						},
					),
			},
		});
		expect(wrapper.text()).toBe("");
	});

	it("updates when state crosses the truth boundary", async () => {
		const store = createConsentStore({ categories: baseCategories });
		const wrapper = mount(PolicyStackConsentProvider, {
			props: { store },
			slots: {
				default: () =>
					h(
						ConsentGate,
						{ requires: "analytics" },
						{
							default: () => h("span", { "data-testid": "child" }, "visible"),
							fallback: () => h("span", { "data-testid": "fb" }, "nope"),
						},
					),
			},
		});
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		store.toggle("analytics");
		await wrapper.vm.$nextTick();
		expect(wrapper.get('[data-testid="child"]').text()).toBe("visible");
		expect(wrapper.find('[data-testid="fb"]').exists()).toBe(false);
	});

	it("evaluates compound expressions", async () => {
		const store = createConsentStore({ categories: baseCategories });
		const wrapper = mount(PolicyStackConsentProvider, {
			props: { store },
			slots: {
				default: () =>
					h(
						ConsentGate,
						{ requires: { and: ["analytics", "marketing"] } },
						{
							default: () => h("span", { "data-testid": "child" }, "both"),
							fallback: () => h("span", { "data-testid": "fb" }, "need both"),
						},
					),
			},
		});
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		store.toggle("analytics");
		await wrapper.vm.$nextTick();
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		store.toggle("marketing");
		await wrapper.vm.$nextTick();
		expect(wrapper.get('[data-testid="child"]').text()).toBe("both");
	});
});
