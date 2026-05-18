import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

type PagefindResult = {
	id: string;
	data: () => Promise<{
		url: string;
		meta: { title?: string };
		excerpt: string;
	}>;
};

type Pagefind = {
	search: (query: string) => Promise<{ results: PagefindResult[] }>;
};

type ResolvedResult = {
	id: string;
	url: string;
	title: string;
	excerpt: string;
};

let pagefindPromise: Promise<Pagefind | null> | null = null;

async function loadPagefind(): Promise<Pagefind | null> {
	if (typeof window === "undefined") return null;
	if (pagefindPromise) return pagefindPromise;
	pagefindPromise = (async () => {
		try {
			const url = "/pagefind/pagefind.js";
			const mod = (await import(/* @vite-ignore */ url)) as Pagefind;
			return mod;
		} catch {
			return null;
		}
	})();
	return pagefindPromise;
}

export function DocsSearch() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ResolvedResult[]>([]);
	const [available, setAvailable] = useState(true);
	const [selected, setSelected] = useState(0);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
	const listboxId = "docs-search-listbox";

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "/" && !open) {
				const t = e.target as HTMLElement | null;
				if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
				e.preventDefault();
				setOpen(true);
			}
			if (e.key === "Escape" && open) setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	useEffect(() => {
		let cancelled = false;
		if (!open || !query.trim()) {
			setResults([]);
			setSelected(0);
			return;
		}
		void (async () => {
			const pf = await loadPagefind();
			if (!pf) {
				setAvailable(false);
				return;
			}
			const res = await pf.search(query);
			const top = await Promise.all(
				res.results.slice(0, 8).map(async (r) => {
					const data = await r.data();
					// Pagefind returns URLs with a trailing slash (because each page
					// is indexed as <slug>/index.html). Strip it so the link matches
					// the live route ("/docs/policy/cli", not ".../cli/").
					const url = data.url.replace(/\/$/, "") || "/";
					return {
						id: r.id,
						url,
						title: data.meta.title ?? url,
						excerpt: data.excerpt,
					};
				}),
			);
			if (!cancelled) {
				setResults(top);
				setSelected(0);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [query, open]);

	// Keep the highlighted item visible inside the scroll container.
	useEffect(() => {
		if (!results.length) return;
		itemRefs.current[selected]?.scrollIntoView({ block: "nearest" });
	}, [selected, results]);

	function navigateTo(url: string) {
		setOpen(false);
		router.history.push(url);
	}

	function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (!results.length) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelected((s) => (s + 1) % results.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelected((s) => (s - 1 + results.length) % results.length);
		} else if (e.key === "Home") {
			e.preventDefault();
			setSelected(0);
		} else if (e.key === "End") {
			e.preventDefault();
			setSelected(results.length - 1);
		} else if (e.key === "Enter") {
			e.preventDefault();
			const target = results[selected];
			if (target) navigateTo(target.url);
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex w-full items-center gap-3 border-2 border-black px-4 py-2.5 text-left text-sm text-mute hover:text-ink"
			>
				<MagnifyingGlassIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
				<span className="flex-1">Search docs</span>
				<kbd className="border border-black/30 px-1.5 py-0.5 text-[0.625rem] tracking-wide uppercase">
					/
				</kbd>
			</button>

			{open && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Search docs"
					className="fixed inset-0 z-50 flex flex-col items-center bg-black/40 p-4 pt-24"
					onClick={(e) => {
						if (e.target === e.currentTarget) setOpen(false);
					}}
				>
					<div className="w-full max-w-xl border-2 border-black bg-canvas">
						<div className="flex items-center gap-3 border-b-2 border-black px-4 py-3">
							<MagnifyingGlassIcon
								weight="bold"
								className="size-4 shrink-0 text-mute"
								aria-hidden="true"
							/>
							<input
								ref={inputRef}
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={onInputKeyDown}
								placeholder="Search docs…"
								role="combobox"
								aria-expanded={results.length > 0}
								aria-controls={listboxId}
								aria-activedescendant={
									results.length > 0 ? `docs-search-option-${selected}` : undefined
								}
								autoComplete="off"
								className="flex-1 bg-transparent text-base text-ink outline-none placeholder:text-mute"
							/>
							<button
								type="button"
								onClick={() => setOpen(false)}
								aria-label="Close"
								className="text-mute hover:text-ink"
							>
								<XIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
							</button>
						</div>
						<div className="max-h-96 overflow-y-auto" role="presentation">
							{!available ? (
								<p className="px-4 py-6 text-sm text-mute">
									Search index unavailable. Run a production build to enable search.
								</p>
							) : results.length === 0 ? (
								<p className="px-4 py-6 text-sm text-mute">
									{query.trim() ? "No results." : "Type to search."}
								</p>
							) : (
								<ul id={listboxId} role="listbox" aria-label="Search results">
									{results.map((r, i) => {
										const isSelected = i === selected;
										return (
											<li
												key={r.id}
												id={`docs-search-option-${i}`}
												role="option"
												aria-selected={isSelected}
												className="border-t border-black/15 first:border-t-0"
											>
												<a
													ref={(el) => {
														itemRefs.current[i] = el;
													}}
													href={r.url}
													className={
														isSelected
															? "block bg-ink/5 px-4 py-3"
															: "block px-4 py-3 hover:bg-ink/5"
													}
													onMouseEnter={() => setSelected(i)}
													onClick={(e) => {
														e.preventDefault();
														navigateTo(r.url);
													}}
												>
													<p className="text-sm text-ink">{r.title}</p>
													<p
														className="mt-1 text-xs text-mute [&_mark]:bg-ink [&_mark]:px-0.5 [&_mark]:text-canvas"
														dangerouslySetInnerHTML={{ __html: r.excerpt }}
													/>
												</a>
											</li>
										);
									})}
								</ul>
							)}
						</div>
						{results.length > 0 && (
							<div className="flex items-center gap-4 border-t-2 border-black px-4 py-2 text-[0.6875rem] tracking-wide text-mute uppercase">
								<span className="flex items-center gap-1.5">
									<kbd className="border border-black/30 px-1.5 py-0.5">↑</kbd>
									<kbd className="border border-black/30 px-1.5 py-0.5">↓</kbd>
									to navigate
								</span>
								<span className="flex items-center gap-1.5">
									<kbd className="border border-black/30 px-1.5 py-0.5">Enter</kbd>
									to open
								</span>
								<span className="ml-auto flex items-center gap-1.5">
									<kbd className="border border-black/30 px-1.5 py-0.5">Esc</kbd>
									to close
								</span>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
