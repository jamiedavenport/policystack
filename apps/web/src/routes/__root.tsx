import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { Databuddy } from "@databuddy/sdk/react";
import { OffstageProvider } from "@offstage/react";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { ConsentGate } from "@policystack/react/consent";
import { PolicyStackProvider } from "@policystack/react/provider";

import favicon from "../assets/favicon.svg?url";
import appCss from "../styles.css?url";
import { SITE_NAME, SITE_URL } from "../lib/seo";
import openpolicy from "../policystack";
import { NotFound } from "../components/NotFound";
import { CookieBanner } from "../components/CookieBanner";
import { CookiePreferences } from "../components/CookiePreferences";
import { CookieSettingsLink } from "../components/CookieSettingsLink";

const ORG_JSON_LD = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: SITE_NAME,
	url: SITE_URL,
	logo: `${SITE_URL}/logo512.png`,
	sameAs: [
		"https://github.com/jamiedavenport/openpolicy",
		"https://github.com/jamiedavenport/opencookies",
	],
};

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "theme-color", content: "#000000" },
			{ name: "robots", content: "index,follow" },
			{ name: "format-detection", content: "telephone=no" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: favicon },
			{ rel: "manifest", href: "/manifest.json" },
			{
				rel: "alternate",
				type: "application/rss+xml",
				title: `${SITE_NAME} blog`,
				href: `${SITE_URL}/rss.xml`,
			},
			{ rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
		],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify(ORG_JSON_LD),
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="antialiased">
			<head>
				<HeadContent />
			</head>
			<body className="bg-canvas font-sans text-ink">
				<PolicyStackProvider config={openpolicy}>
					<div id="app" className="isolate flex min-h-dvh flex-col">
						<SiteHeader />
						<main className="flex-1">{children ?? <Outlet />}</main>
						<SiteFooter />
					</div>
					<CookieBanner />
					<CookiePreferences />
					{/* Analytics only loads once the visitor allows it. Offstage has
					    no context consumers in this app, so gating it as a sibling
					    (rather than wrapping #app) keeps the app from remounting
					    when consent is toggled. */}
					<ConsentGate requires="analytics">
						<OffstageProvider apiKey="pk_live_IeaDz82n3CMK_bXICW_Q1aGfN96as_HZ">
							<></>
						</OffstageProvider>
						<Databuddy clientId="831fa430-6fdb-4fe2-ab59-867bdc90847a" />
					</ConsentGate>
				</PolicyStackProvider>
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}

function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b-2 border-black bg-canvas/90 backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-x-8 px-6 py-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8 md:py-5">
				<Link
					to="/"
					aria-label="Homepage"
					className="flex items-center gap-3 text-sm tracking-wide uppercase"
				>
					<span aria-hidden="true" className="inline-block size-3 bg-black" />
					<span>policystack</span>
				</Link>

				<nav className="hidden items-center gap-x-8 text-sm tracking-wide text-mute uppercase md:flex">
					<Link
						to="/opencookies"
						className="flex items-center gap-2.5 hover:text-ink"
						activeProps={{ className: "text-ink" }}
					>
						<ProductMark filled={1} />
						<span>opencookies</span>
					</Link>
					<Link
						to="/openpolicy"
						className="flex items-center gap-2.5 hover:text-ink"
						activeProps={{ className: "text-ink" }}
					>
						<ProductMark filled={2} />
						<span>openpolicy</span>
					</Link>
					<Link
						to="/policycloud"
						className="flex items-center gap-2.5 hover:text-ink"
						activeProps={{ className: "text-ink" }}
					>
						<ProductMark filled={3} />
						<span>policycloud</span>
					</Link>
				</nav>

				<div className="flex items-center gap-x-6 text-sm tracking-wide text-mute uppercase md:justify-end">
					<Link
						to="/docs"
						className="hidden hover:text-ink md:inline"
						activeProps={{ className: "text-ink" }}
					>
						docs
					</Link>
					<Link
						to="/blog"
						className="hidden hover:text-ink md:inline"
						activeProps={{ className: "text-ink" }}
					>
						blog
					</Link>
					<Link
						to="/docs"
						className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 text-xs tracking-wide text-white uppercase hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
					>
						<span>get started</span>
						<ArrowRightIcon weight="bold" className="size-3.5 shrink-0" aria-hidden="true" />
					</Link>
				</div>
			</div>
		</header>
	);
}

function ProductMark({ filled }: { filled: 1 | 2 | 3 }) {
	return (
		<svg viewBox="0 0 12 12" aria-hidden="true" className="size-3 shrink-0">
			{[3, 2, 1].map((position, i) => (
				<rect
					key={position}
					x="0.5"
					y={i * 4 + 0.5}
					width="11"
					height="2"
					fill={filled >= position ? "currentColor" : "none"}
					stroke="currentColor"
					strokeWidth="0"
				/>
			))}
		</svg>
	);
}

function SiteFooter() {
	return (
		<footer className="border-t-2 border-black">
			<div className="mx-auto grid max-w-6xl gap-16 px-8 py-24 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
				<div>
					<Link
						to="/"
						aria-label="Homepage"
						className="flex items-center gap-3 text-sm tracking-wide uppercase"
					>
						<span aria-hidden="true" className="inline-block size-3 bg-black" />
						<span>policystack</span>
					</Link>
					<p className="mt-8 max-w-[42ch] text-sm text-pretty text-mute">
						Privacy and consent primitives for developers and AI. Version-controlled, composable,
						open source.
					</p>
				</div>
				<FooterCol
					title="open source"
					links={[
						{ to: "/opencookies", label: "OpenCookies" },
						{ to: "/openpolicy", label: "PolicyStack" },
						{ to: "/policycloud", label: "PolicyCloud" },
					]}
				/>
				<FooterCol
					title="resources"
					links={[
						{ to: "/docs", label: "Docs" },
						{ to: "/blog", label: "Blog" },
						{ href: "mailto:jamie@openpolicy.sh", label: "Contact" },
					]}
				/>
				<div>
					<h3 className="text-xs tracking-wide text-ink uppercase">legal</h3>
					<ul role="list" className="mt-6 space-y-4 text-sm text-mute">
						<li>
							<Link to="/privacy" className="hover:text-ink">
								Privacy
							</Link>
						</li>
						<CookieSettingsLink />
					</ul>
				</div>
			</div>
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-8 py-6 text-xs tracking-wide text-mute uppercase">
				<span>© {new Date().getFullYear()} PolicyStack Ltd — apache-2.0 where noted</span>
				<a
					href="https://jxd.dev"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-ink"
				>
					built by jxd.dev
				</a>
			</div>
		</footer>
	);
}

function FooterCol({
	title,
	links,
}: {
	title: string;
	links: Array<{
		to?: string;
		href?: string;
		label: string;
		external?: boolean;
	}>;
}) {
	return (
		<div>
			<h3 className="text-xs tracking-wide text-ink uppercase">{title}</h3>
			<ul role="list" className="mt-6 space-y-4 text-sm text-mute">
				{links.map((l) => (
					<li key={l.label}>
						{l.to ? (
							<Link to={l.to} className="hover:text-ink">
								{l.label}
							</Link>
						) : (
							<a
								href={l.href}
								{...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
								className="inline-flex items-center gap-1.5 hover:text-ink"
							>
								<span>{l.label}</span>
								{l.external && (
									<ArrowUpRightIcon
										weight="bold"
										className="size-3.5 shrink-0"
										aria-hidden="true"
									/>
								)}
							</a>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
