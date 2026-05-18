import { Link, useLocation } from "@tanstack/react-router";
import {
	ArrowRightIcon,
	ArrowUpRightIcon,
	HouseIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { allPosts } from "content-collections";
import { Highlight } from "./Highlight";

const PRODUCTS = [
	{
		n: "01",
		to: "/consent",
		slug: "consent",
		title: "A headless consent state machine.",
		body: "Sub-4kb core with adapters for React, Vue, Solid, Svelte, and Angular.",
	},
	{
		n: "02",
		to: "/policy",
		slug: "policy",
		title: "Your policy as a typed config.",
		body: "Define your privacy and cookie policy once in TypeScript. Render anywhere.",
	},
	{
		n: "03",
		to: "/cloud",
		slug: "cloud",
		title: "The hosted control plane.",
		body: "Centralized versioning, audit trails, and consent analytics across your stack.",
	},
] as const;

const QUICK_LINKS = [
	{ to: "/", label: "Home", hint: "the whole stack" },
	{ to: "/policy", label: "PolicyStack", hint: "policy-as-code" },
	{ to: "/consent", label: "PolicyStack Consent", hint: "consent state machine" },
	{ to: "/cloud", label: "PolicyStack Cloud", hint: "hosted control plane" },
	{ to: "/docs", label: "Documentation", hint: "guides and reference" },
	{ to: "/blog", label: "Blog", hint: "notes and releases" },
] as const;

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function SectionMarker({ index, label }: { index: string; label: string }) {
	return (
		<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
			<span className="text-ink">[{index}]</span>
			<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
			<span>{label}</span>
		</div>
	);
}

export function NotFound() {
	const recentPosts = [...allPosts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

	return (
		<>
			<title>Page not found — PolicyStack</title>
			<meta
				name="description"
				content="The page you were looking for doesn't exist on PolicyStack. Find the products, docs, and recent blog posts here."
			/>
			<meta name="robots" content="noindex,follow" />
			<Hero />
			<QuickLinks />
			<Products />
			<RecentPosts posts={recentPosts} />
			<Help />
		</>
	);
}

function Hero() {
	const location = useLocation();
	const path = location.pathname || "/";

	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 pt-28 pb-32 md:pt-36 md:pb-40">
				<SectionMarker index="404" label="page not found" />

				<h1 className="mt-12 max-w-[20ch] text-5xl font-medium tracking-tight text-balance md:text-7xl">
					Wrong path, <Highlight>right neighborhood.</Highlight>
				</h1>

				<p className="mt-12 max-w-[60ch] text-lg text-pretty text-mute">
					The page you wanted isn&rsquo;t here. If you followed a link from policystack.dev, that
					site folded into PolicyStack &mdash; everything PolicyStack lives under this roof now,
					alongside PolicyStack Consent and PolicyStack Cloud. Otherwise, it&rsquo;s probably a typo
					or a stale link.
				</p>

				<div className="mt-12 max-w-xl border-2 border-black">
					<div className="flex items-center gap-3 border-b-2 border-black px-4 py-2.5 text-[0.6875rem] tracking-wide text-mute uppercase">
						<span aria-hidden="true" className="inline-block size-2 bg-black" />
						<span>requested path</span>
					</div>
					<p className="overflow-x-auto px-4 py-4 text-sm text-ink">
						<span className="text-mute">policystack.dev</span>
						<span>{path}</span>
					</p>
				</div>

				<div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-4">
					<Link
						to="/"
						className="inline-flex items-center gap-2.5 border-2 border-black bg-black px-6 py-3.5 text-sm tracking-wide text-white uppercase hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
					>
						<HouseIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
						back home
					</Link>
					<Link
						to="/docs"
						className="inline-flex items-center gap-2.5 border-2 border-black px-6 py-3.5 text-sm tracking-wide uppercase hover:bg-black hover:text-white"
					>
						<MagnifyingGlassIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
						search the docs
					</Link>
				</div>
			</div>
		</section>
	);
}

function QuickLinks() {
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-24 md:py-32">
				<SectionMarker index="01" label="popular paths" />
				<h2 className="mt-12 max-w-[28ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					Where most people are headed.
				</h2>
				<dl className="mt-16 grid border-2 border-black md:grid-cols-3">
					{QUICK_LINKS.map((link, i) => {
						const col = i % 3;
						const isLastRow = i >= QUICK_LINKS.length - (QUICK_LINKS.length % 3 || 3);
						return (
							<Link
								key={link.to}
								to={link.to}
								className={[
									"group flex items-center justify-between gap-6 border-black p-6 md:p-8",
									"max-md:not-last:border-b-2",
									!isLastRow && "md:border-b-2",
									col < 2 && "md:border-r-2",
								]
									.filter(Boolean)
									.join(" ")}
							>
								<div>
									<dt className="text-base font-medium tracking-tight text-ink">{link.label}</dt>
									<dd className="mt-1 text-xs tracking-wide text-mute uppercase">{link.hint}</dd>
								</div>
								<ArrowRightIcon
									weight="bold"
									aria-hidden="true"
									className="size-4 shrink-0 text-ink transition group-hover:translate-x-1"
								/>
							</Link>
						);
					})}
				</dl>
			</div>
		</section>
	);
}

function Products() {
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-24 md:py-32">
				<SectionMarker index="02" label="the building blocks" />
				<h2 className="mt-12 max-w-[28ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					Three open-source primitives. Use one. Use <Highlight>all three.</Highlight>
				</h2>
				<p className="mt-8 max-w-[60ch] text-lg text-pretty text-mute">
					Privacy and consent as composable infrastructure &mdash; version-controlled, testable, and
					friendly to AI agents.
				</p>

				<dl className="mt-16 grid border-2 border-black md:grid-cols-3">
					{PRODUCTS.map((product) => (
						<Link
							key={product.slug}
							to={product.to}
							className="group flex flex-col justify-between gap-10 border-black p-8 not-last:border-b-2 max-md:not-last:border-b-2 md:not-last:border-r-2 md:not-last:border-b-0"
						>
							<div>
								<div className="flex items-center justify-between text-xs tracking-wide text-mute uppercase">
									<span className="text-ink">[{product.n}]</span>
									<span>{product.slug}</span>
								</div>
								<dt className="mt-8 text-lg font-medium tracking-tight text-balance">
									{product.title}
								</dt>
								<dd className="mt-4 text-sm text-pretty text-mute">{product.body}</dd>
							</div>
							<span className="inline-flex items-center gap-2 text-xs tracking-wide text-ink uppercase">
								<span>read more</span>
								<ArrowRightIcon
									weight="bold"
									aria-hidden="true"
									className="size-3.5 transition group-hover:translate-x-1"
								/>
							</span>
						</Link>
					))}
				</dl>
			</div>
		</section>
	);
}

type Post = (typeof allPosts)[number];

function RecentPosts({ posts }: { posts: Post[] }) {
	if (posts.length === 0) return null;
	const [featured, ...rest] = posts;

	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-24 md:py-32">
				<SectionMarker index="03" label="from the blog" />
				<div className="mt-12 grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-end">
					<h2 className="max-w-[28ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
						Notes from building <Highlight>PolicyStack.</Highlight>
					</h2>
					<p className="max-w-[48ch] text-base text-pretty text-mute">
						Integration guides, design notes, and the occasional opinion about how the privacy
						ecosystem could work better.
					</p>
				</div>

				<Link
					to="/blog/$slug"
					params={{ slug: featured.slug }}
					className="group mt-16 block border-2 border-black"
				>
					<div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black px-6 py-3 text-xs tracking-wide text-mute uppercase md:px-8">
						<div className="flex items-center gap-3">
							<span className="inline-block size-2 bg-black" aria-hidden="true" />
							<span className="text-ink">latest</span>
							<span aria-hidden="true">·</span>
							<span>{featured.tag}</span>
						</div>
						<div className="flex items-center gap-3">
							<time dateTime={featured.date}>{formatDate(featured.date)}</time>
							<span aria-hidden="true">·</span>
							<span>{featured.readingTime}</span>
						</div>
					</div>
					<div className="px-6 py-10 md:px-10 md:py-14">
						<h3 className="max-w-[24ch] text-2xl font-medium tracking-tight text-balance text-ink group-hover:underline group-hover:underline-offset-4 md:text-4xl">
							{featured.title}
						</h3>
						<p className="mt-6 max-w-[60ch] text-base text-pretty text-mute">{featured.excerpt}</p>
						<div className="mt-10 inline-flex items-center gap-2.5 border-2 border-black bg-black px-5 py-3 text-xs tracking-wide text-white uppercase group-hover:bg-white group-hover:text-black">
							<span>read post</span>
							<ArrowRightIcon
								weight="bold"
								aria-hidden="true"
								className="size-3.5 transition group-hover:translate-x-1"
							/>
						</div>
					</div>
				</Link>

				{rest.length > 0 && (
					<ul role="list" className="mt-10 border-y-2 border-black divide-y-2 divide-black">
						{rest.map((post) => (
							<li key={post.slug}>
								<Link
									to="/blog/$slug"
									params={{ slug: post.slug }}
									className="group flex flex-wrap items-baseline gap-x-6 gap-y-2 px-2 py-6"
								>
									<time
										className="text-xs tracking-wide text-mute uppercase tabular-nums"
										dateTime={post.date}
									>
										{formatDate(post.date)}
									</time>
									<span className="text-xs tracking-wide text-ink uppercase">{post.tag}</span>
									<span className="flex-1 text-base text-ink group-hover:underline group-hover:underline-offset-4">
										{post.title}
									</span>
									<span className="text-xs tracking-wide text-mute uppercase">
										{post.readingTime}
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}

				<div className="mt-12 flex justify-start">
					<Link
						to="/blog"
						className="inline-flex items-center gap-2.5 border-2 border-black px-6 py-3 text-xs tracking-wide uppercase hover:bg-black hover:text-white"
					>
						<span>browse all posts</span>
						<ArrowRightIcon weight="bold" aria-hidden="true" className="size-3.5" />
					</Link>
				</div>
			</div>
		</section>
	);
}

function Help() {
	return (
		<section>
			<div className="mx-auto max-w-6xl px-8 py-24 md:py-32">
				<SectionMarker index="04" label="still stuck" />
				<div className="mt-12 grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-end">
					<div>
						<h2 className="max-w-[24ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
							Tell us what you were <Highlight>looking for.</Highlight>
						</h2>
						<p className="mt-8 max-w-[55ch] text-base text-pretty text-mute">
							If you landed here from a search or an old policystack.dev link that should still
							work, send a note &mdash; we&rsquo;ll add a redirect.
						</p>
					</div>
					<div className="flex flex-col items-stretch gap-4 md:ml-auto md:w-72">
						<a
							href="mailto:jamie@policystack.dev?subject=Broken%20link%20on%20policystack.dev"
							className="inline-flex items-center justify-center gap-2.5 border-2 border-black bg-black px-6 py-3.5 text-sm tracking-wide text-white uppercase hover:bg-white hover:text-black"
						>
							<ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
							report a broken link
						</a>
						<a
							href="https://github.com/jamiedavenport/policystack/issues"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center gap-2.5 border-2 border-black px-6 py-3.5 text-sm tracking-wide uppercase hover:bg-black hover:text-white"
						>
							<span>open a GitHub issue</span>
							<ArrowUpRightIcon weight="bold" className="size-3.5 shrink-0" aria-hidden="true" />
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
