import { computed, inject, type Signal } from "@angular/core";
import { ConsentService } from "./consent.service";

export type CategoryRef = {
	granted: Signal<boolean>;
	toggle: () => void;
};

// `granted` is the checkbox view and includes staged draft edits; effective
// consent (`has()` / <ConsentGate>) only moves on save().
export function injectCategory(key: string): CategoryRef {
	const consent = inject(ConsentService);
	return {
		granted: computed(() => (consent.draft() ?? consent.decisions())[key] === true),
		toggle: () => consent.toggle(key),
	};
}
