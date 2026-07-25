import { computed, inject, type Signal } from "@angular/core";
import { ConsentService } from "./consent.service";

export type CategoryRef = {
	granted: Signal<boolean>;
	toggle: () => void;
};

// `granted` is the checkbox view: it reflects staged (unsaved) edits from the
// draft. Effective consent — what gates content and scripts — is `has()` /
// <ConsentGate>, which only move on save().
export function injectCategory(key: string): CategoryRef {
	const consent = inject(ConsentService);
	return {
		granted: computed(() => (consent.draft() ?? consent.decisions())[key] === true),
		toggle: () => consent.toggle(key),
	};
}
