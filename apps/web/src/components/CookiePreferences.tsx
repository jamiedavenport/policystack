"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { useCategory, useConsent } from "@openpolicy/react/consent";
import type { Category } from "@openpolicy/core/consent";

const primaryButton =
	"inline-flex items-center justify-center border-2 border-black bg-black px-4 py-2 text-xs tracking-wide text-white uppercase hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

const secondaryButton =
	"inline-flex items-center justify-center border-2 border-black bg-canvas px-4 py-2 text-xs tracking-wide text-ink uppercase hover:bg-ink hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

const DESCRIPTIONS: Record<string, string> = {
	essential:
		"Required for the site to work — security, session, and your consent choice itself. Always on.",
	analytics:
		"Lets us measure which pages are used so we can improve the site. Off until you allow it.",
	marketing: "Used to personalise and measure marketing. Off until you allow it.",
};

function CategoryRow({ category }: { category: Category }) {
	const { granted, toggle } = useCategory(category.key);
	const inputId = `consent-${category.key}`;
	const description = category.description ?? DESCRIPTIONS[category.key] ?? "";

	return (
		<li className="flex items-start justify-between gap-4 border-t-2 border-black py-4 first:border-t-0">
			<div className="min-w-0">
				<label htmlFor={inputId} className="text-sm tracking-wide text-ink uppercase">
					{category.label}
				</label>
				{description && <p className="mt-1 text-xs text-pretty text-mute">{description}</p>}
			</div>
			<span className="relative inline-flex h-6 w-12 shrink-0 border-2 border-black">
				<input
					id={inputId}
					name={category.key}
					type="checkbox"
					checked={granted}
					disabled={category.locked}
					onChange={() => toggle()}
					aria-label={category.label}
					className="peer absolute inset-0 z-10 size-full cursor-pointer appearance-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed"
				/>
				<span
					aria-hidden="true"
					className="absolute inset-0 bg-canvas peer-checked:bg-black peer-disabled:peer-checked:bg-mute"
				/>
				<span
					aria-hidden="true"
					className="absolute top-0.5 left-1 size-4 bg-black transition-transform duration-150 ease-in-out peer-checked:translate-x-5 peer-checked:bg-canvas"
				/>
			</span>
		</li>
	);
}

export function CookiePreferences() {
	const { route, categories, save, setRoute } = useConsent();
	const panelRef = useRef<HTMLDivElement>(null);

	// Match CookieBanner: hold the UI until after hydration so a returning
	// visitor's localStorage-derived state never disagrees with SSR.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const open = mounted && route === "preferences";

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setRoute("cookie");
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, setRoute]);

	useEffect(() => {
		if (open) panelRef.current?.focus();
	}, [open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close cookie preferences"
				onClick={() => setRoute("cookie")}
				className="absolute inset-0 size-full cursor-default bg-black/60"
			/>
			<div
				ref={panelRef}
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				aria-label="Cookie preferences"
				className="relative w-full max-w-lg border-2 border-black bg-canvas outline-none"
			>
				<div className="flex items-center justify-between border-b-2 border-black px-6 py-4">
					<h2 className="text-sm tracking-wide text-ink uppercase">Cookie preferences</h2>
					<button
						type="button"
						onClick={() => setRoute("cookie")}
						className="inline-flex items-center gap-2 text-xs tracking-wide uppercase hover:text-mute"
						aria-label="Close cookie preferences"
					>
						<XIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
						Close
					</button>
				</div>

				<ul role="list" className="max-h-[60dvh] overflow-y-auto px-6">
					{categories.map((category) => (
						<CategoryRow key={category.key} category={category} />
					))}
				</ul>

				<div className="flex flex-col gap-2 border-t-2 border-black px-6 py-4 sm:flex-row sm:justify-end">
					<button type="button" onClick={() => setRoute("cookie")} className={secondaryButton}>
						Back
					</button>
					<button type="button" onClick={() => save()} className={primaryButton}>
						Save choices
					</button>
				</div>
			</div>
		</div>
	);
}
