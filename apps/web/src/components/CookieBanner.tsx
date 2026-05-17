"use client";

import { useEffect, useState } from "react";
import { useConsent } from "@openpolicy/react/consent";

const primaryButton =
	"inline-flex items-center justify-center border-2 border-black bg-black px-4 py-2 text-xs tracking-wide text-white uppercase hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

const secondaryButton =
	"inline-flex items-center justify-center border-2 border-black bg-canvas px-4 py-2 text-xs tracking-wide text-ink uppercase hover:bg-ink hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

export function CookieBanner() {
	const { route, acceptAll, acceptNecessary, setRoute } = useConsent();

	// The store reads localStorage during the first client render, so a returning
	// visitor's first client render disagrees with SSR (route "closed" vs
	// "cookie"). Holding the UI until after hydration avoids the mismatch and the
	// banner-flash for visitors who already decided.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted || route !== "cookie") return null;

	return (
		<div
			role="region"
			aria-label="Cookie consent"
			className="fixed inset-x-4 bottom-4 z-50 border-2 border-black bg-canvas p-5 sm:inset-x-auto sm:right-4 sm:max-w-md"
		>
			<p className="text-sm text-pretty text-mute">
				We use cookies to keep the site running and, with your permission, to measure how it's used.
				You can change this anytime via Cookie settings in the footer.
			</p>
			<div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
				<button type="button" onClick={() => acceptNecessary()} className={secondaryButton}>
					Necessary only
				</button>
				<button type="button" onClick={() => setRoute("preferences")} className={secondaryButton}>
					Customize
				</button>
				<button type="button" onClick={() => acceptAll()} className={primaryButton}>
					Accept all
				</button>
			</div>
		</div>
	);
}
