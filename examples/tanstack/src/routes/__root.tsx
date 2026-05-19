// src/routes/__root.tsx
/// <reference types="vite-plus/client" />

import { PolicyStack } from "@policystack/react/provider";
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";

function GithubIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
			<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
		</svg>
	);
}

import { TooltipProvider } from "@/components/ui/tooltip";
import policystack from "../policystack";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "PolicyStack — TanStack Example" },
			{
				name: "description",
				content:
					"Demo app showing three ways to style PolicyStack React components in a TanStack Start app.",
			},
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<RootDocument>
			<TooltipProvider>
				{/* One provider for everything: supplies the policy context AND,
				    because this config declares `cookies`, the consent store. */}
				<PolicyStack config={policystack}>
					<Outlet />
				</PolicyStack>
			</TooltipProvider>
		</RootDocument>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background text-foreground">
				<header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
					<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
						<Link
							to="/"
							className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity"
						>
							<span className="text-lg">PolicyStack</span>
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
								TanStack
							</span>
						</Link>

						<nav className="flex items-center gap-1">
							<Link
								to="/tailwind"
								className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
							>
								Tailwind
							</Link>
							<Link
								to="/css-vars"
								className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
							>
								CSS Variables
							</Link>
							<Link
								to="/shadcn"
								className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
							>
								shadcn
							</Link>
							<Link
								to="/fr"
								className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
							>
								FR
							</Link>
							<Link
								to="/de"
								className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
							>
								DE
							</Link>
							<Link
								to="/nl"
								className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
							>
								NL
							</Link>
							<Link
								to="/es"
								className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
							>
								ES
							</Link>
						</nav>

						<div className="flex items-center gap-3">
							<a
								href="https://policystack.dev"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								policystack.dev
							</a>
							<a
								href="https://github.com/jamiedavenport/policystack"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-foreground transition-colors"
								aria-label="GitHub repository"
							>
								<GithubIcon className="size-4" />
							</a>
						</div>
					</div>
				</header>

				{children}

				<footer className="border-t mt-16">
					<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm text-muted-foreground">
						<span>
							Built with{" "}
							<a
								href="https://policystack.dev"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:text-foreground transition-colors underline underline-offset-2"
							>
								PolicyStack
							</a>{" "}
							+{" "}
							<a
								href="https://tanstack.com/start"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:text-foreground transition-colors underline underline-offset-2"
							>
								TanStack Start
							</a>
						</span>
						<a
							href="https://github.com/jamiedavenport/policystack"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 hover:text-foreground transition-colors"
						>
							<GithubIcon className="size-3.5" />
							jamiedavenport/policystack
						</a>
					</div>
				</footer>

				<Scripts />
			</body>
		</html>
	);
}
