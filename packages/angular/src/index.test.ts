// @vitest-environment happy-dom
import "zone.js";

import { Injector, runInInjectionContext, type StaticProvider } from "@angular/core";
import { createConsentStore, type Category, type ConsentStore } from "@policystack/core/consent";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ConsentService } from "./consent.service";
import { injectCategory } from "./category";
import { providePolicyStackConsent } from "./provider";
import { POLICYSTACK_CONSENT_STORE } from "./tokens";

const baseCategories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

afterEach(() => {
	vi.restoreAllMocks();
});

function injectorWithStore(store: ConsentStore): Injector {
	const providers: StaticProvider[] = [
		{ provide: POLICYSTACK_CONSENT_STORE, useValue: store },
		{ provide: ConsentService, useClass: ConsentService, deps: [] },
	];
	return Injector.create({ providers });
}

describe("providePolicyStackConsent", () => {
	it("returns EnvironmentProviders without invoking the factory", () => {
		const result = providePolicyStackConsent({ config: { categories: baseCategories } });
		expect(result).toBeDefined();
	});

	it("accepts a pre-created store", () => {
		const store = createConsentStore({ categories: baseCategories });
		const result = providePolicyStackConsent({ store });
		expect(result).toBeDefined();
	});
});

describe("ConsentService", () => {
	it("exposes signals derived from store state", () => {
		const store = createConsentStore({ categories: baseCategories });
		const consent = injectorWithStore(store).get(ConsentService);
		expect(consent.route()).toBe("cookie");
		expect(consent.decisions().analytics).toBe(false);
		expect(consent.categories()).toHaveLength(3);
	});

	it("re-evaluates signals when the store updates", () => {
		const store = createConsentStore({ categories: baseCategories });
		const consent = injectorWithStore(store).get(ConsentService);
		expect(consent.route()).toBe("cookie");
		consent.acceptAll();
		expect(consent.route()).toBe("closed");
		expect(consent.decisions().analytics).toBe(true);
	});

	it("toggle then save records a decision", () => {
		const store = createConsentStore({ categories: baseCategories });
		const consent = injectorWithStore(store).get(ConsentService);
		consent.toggle("analytics");
		expect(consent.decisions().analytics).toBe(true);
		expect(consent.decidedAt()).toBeNull();
		consent.save();
		expect(consent.decidedAt()).not.toBeNull();
		expect(consent.route()).toBe("closed");
	});

	it("setRoute updates the route", () => {
		const store = createConsentStore({ categories: baseCategories });
		const consent = injectorWithStore(store).get(ConsentService);
		consent.setRoute("preferences");
		expect(consent.route()).toBe("preferences");
	});

	it("getConsentRecord returns null pre-decision and v1 record after acceptAll", () => {
		const store = createConsentStore({ categories: baseCategories });
		const consent = injectorWithStore(store).get(ConsentService);
		expect(consent.getConsentRecord()).toBeNull();
		consent.acceptAll();
		const record = consent.getConsentRecord();
		expect(record?.schemaVersion).toBe(1);
		expect(record?.source).toBe("banner");
	});

	it("has() evaluates compound expressions", () => {
		const store = createConsentStore({ categories: baseCategories });
		const consent = injectorWithStore(store).get(ConsentService);
		expect(consent.has({ and: ["analytics", "marketing"] })).toBe(false);
		store.toggle("analytics");
		store.toggle("marketing");
		expect(consent.has({ and: ["analytics", "marketing"] })).toBe(true);
	});
});

describe("injectCategory", () => {
	it("returns granted false initially for non-locked categories", () => {
		const store = createConsentStore({ categories: baseCategories });
		const cat = runInInjectionContext(injectorWithStore(store), () => injectCategory("analytics"));
		expect(cat.granted()).toBe(false);
	});

	it("returns granted true for locked categories", () => {
		const store = createConsentStore({ categories: baseCategories });
		const cat = runInInjectionContext(injectorWithStore(store), () => injectCategory("essential"));
		expect(cat.granted()).toBe(true);
	});

	it("flips on toggle", () => {
		const store = createConsentStore({ categories: baseCategories });
		const cat = runInInjectionContext(injectorWithStore(store), () => injectCategory("analytics"));
		cat.toggle();
		expect(cat.granted()).toBe(true);
	});
});
