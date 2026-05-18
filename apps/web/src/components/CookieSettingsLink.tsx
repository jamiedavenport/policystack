"use client";

import { useConsent } from "@policystack/react/consent";

// Persistent re-entry point: lets a visitor reopen the preferences modal after
// they've already made (or to revise) a choice. Rendered inside the footer's
// "legal" list so it inherits the footer link styling.
export function CookieSettingsLink() {
	const { setRoute } = useConsent();
	return (
		<li>
			<button
				type="button"
				onClick={() => setRoute("preferences")}
				className="text-left hover:text-ink"
			>
				Cookie settings
			</button>
		</li>
	);
}
