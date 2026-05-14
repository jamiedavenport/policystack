import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
			<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
		</svg>
	);
}

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

const demos = [
	{
		to: "/tailwind" as const,
		label: "Tailwind",
		description:
			"Style policy components using Tailwind utility classes and the descendant combinator to target data attributes.",
		code: "**:data-op-heading:text-xl **:data-op-paragraph:text-muted-foreground",
		badge: "Recommended",
	},
	{
		to: "/css-vars" as const,
		label: "CSS Variables",
		description:
			"Theme every aspect of the policy output with CSS custom properties — no framework required.",
		code: "--policy-heading-size: 1.25rem\n--policy-text-color: oklch(0.556 0 0)",
		badge: null,
	},
	{
		to: "/shadcn" as const,
		label: "shadcn Components",
		description:
			"Override individual renderers with custom React components. This demo surfaces policy clause reasons via a shadcn Tooltip.",
		code: "<PrivacyPolicy components={{ Heading }} />",
		badge: "Advanced",
	},
	{
		to: "/onboarding-wizard" as const,
		label: "Onboarding Wizard",
		description:
			"Walks new users through what the app collects by reading dataCollected, thirdParties, and cookies straight off the config — auto-collected metadata as a runtime value.",
		code: "const { dataCollected, thirdParties, cookies } = openpolicy",
		badge: "New",
	},
	{
		to: "/fr" as const,
		label: "Localized policies",
		description:
			"Render the same config in French, German, Dutch, or Spanish via a locale prop on PrivacyPolicy/CookiePolicy. OpenPolicy translates the strings it emits; user-supplied content stays in whichever language you wrote it. Switch via the nav: FR / DE / NL / ES.",
		code: '<PrivacyPolicy locale="fr" />',
		badge: "i18n",
	},
];

function RouteComponent() {
	return (
		<main className="mx-auto max-w-6xl px-6 py-16">
			<div className="mb-16 max-w-2xl">
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
					<span className="size-1.5 rounded-full bg-green-500" />
					Alpha — feedback welcome
				</div>
				<h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
					OpenPolicy
					<br />
					<span className="text-muted-foreground">for TanStack</span>
				</h1>
				<p className="mb-8 text-lg text-muted-foreground leading-relaxed">
					Generate legally-structured privacy policies and cookie policies from a single TypeScript
					config — then render them directly into your React app with full styling control.
				</p>
				<div className="flex flex-wrap items-center gap-3">
					<a
						href="https://openpolicy.sh"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
					>
						Get started
						<ArrowRight className="size-3.5" />
					</a>
					<a
						href="https://github.com/jamiedavenport/openpolicy"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
					>
						<GithubIcon className="size-3.5" />
						View on GitHub
					</a>
				</div>
			</div>

			{/* What this demo shows */}
			<div className="mb-8">
				<h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-muted-foreground">
					What's in this demo
				</h2>
				<p className="text-sm text-muted-foreground">
					Three routes, each showing a different styling approach for the same policy content.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				{demos.map((demo) => (
					<Link
						key={demo.to}
						to={demo.to}
						className="group relative flex flex-col rounded-xl border bg-card p-6 hover:border-foreground/20 hover:shadow-sm transition-all"
					>
						<div className="mb-3 flex items-center justify-between">
							<span className="font-medium text-foreground">{demo.label}</span>
							{demo.badge && (
								<span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
									{demo.badge}
								</span>
							)}
						</div>
						<p className="mb-4 text-sm text-muted-foreground leading-relaxed flex-1">
							{demo.description}
						</p>
						<pre className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground overflow-x-auto font-mono leading-relaxed">
							{demo.code}
						</pre>
						<div className="mt-4 flex items-center gap-1 text-sm font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
							View demo
							<ArrowRight className="size-3.5" />
						</div>
					</Link>
				))}
			</div>

			{/* How it works */}
			<div className="mt-16 rounded-xl border bg-muted/30 p-8">
				<h2 className="mb-6 text-lg font-semibold">How it works</h2>
				<div className="grid gap-6 sm:grid-cols-3">
					<div>
						<div className="mb-2 text-sm font-medium text-foreground">1. Define your config</div>
						<p className="text-sm text-muted-foreground">
							Describe your company, data practices, and legal requirements in a single{" "}
							<code className="font-mono text-xs">defineConfig()</code> call.
						</p>
					</div>
					<div>
						<div className="mb-2 text-sm font-medium text-foreground">2. Compile at build time</div>
						<p className="text-sm text-muted-foreground">
							The <code className="font-mono text-xs">openPolicy()</code> Vite plugin compiles your
							config into HTML/Markdown/PDF during the build.
						</p>
					</div>
					<div>
						<div className="mb-2 text-sm font-medium text-foreground">3. Render with React</div>
						<p className="text-sm text-muted-foreground">
							Drop <code className="font-mono text-xs">&lt;PrivacyPolicy /&gt;</code> or{" "}
							<code className="font-mono text-xs">&lt;CookiePolicy /&gt;</code> anywhere in your
							app.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
