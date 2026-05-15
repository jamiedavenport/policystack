import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Cookie, Database, ExternalLink, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { cookies, dataCollected, thirdParties } from "../openpolicy.gen";

export const Route = createFileRoute("/onboarding-wizard")({
	component: RouteComponent,
});

type StepId = "welcome" | "data" | "third-parties" | "cookies" | "done";

const steps: { id: StepId; label: string }[] = [
	{ id: "welcome", label: "Welcome" },
	{ id: "data", label: "Data" },
	{ id: "third-parties", label: "Services" },
	{ id: "cookies", label: "Cookies" },
	{ id: "done", label: "Done" },
];

function RouteComponent() {
	const [stepIndex, setStepIndex] = useState(0);
	const step = steps[stepIndex];
	const isFirst = stepIndex === 0;
	const isLast = stepIndex === steps.length - 1;

	return (
		<main className="mx-auto max-w-2xl px-6 py-12">
			<div className="mb-8">
				<h1 className="mb-2 text-2xl font-semibold tracking-tight">Welcome to Acme</h1>
				<p className="text-sm text-muted-foreground">
					Before you get started, here's a quick tour of what we collect — all pulled directly from
					your OpenPolicy config at build time.
				</p>
			</div>

			<StepIndicator current={stepIndex} />

			<div className="mt-8 min-h-[320px]">
				{step.id === "welcome" && <WelcomeStep />}
				{step.id === "data" && <DataStep />}
				{step.id === "third-parties" && <ThirdPartiesStep />}
				{step.id === "cookies" && <CookiesStep />}
				{step.id === "done" && <DoneStep onRestart={() => setStepIndex(0)} />}
			</div>

			<Separator className="my-6" />

			<div className="flex items-center justify-between">
				<Button
					variant="outline"
					onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
					disabled={isFirst}
				>
					<ArrowLeft className="size-3.5" />
					Back
				</Button>
				<span className="text-xs text-muted-foreground">
					Step {stepIndex + 1} of {steps.length}
				</span>
				{isLast ? (
					<Button asChild>
						<Link to="/">Finish</Link>
					</Button>
				) : (
					<Button onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}>
						Next
						<ArrowRight className="size-3.5" />
					</Button>
				)}
			</div>
		</main>
	);
}

function StepIndicator({ current }: { current: number }) {
	return (
		<div className="flex items-center gap-2">
			{steps.map((s, i) => (
				<div key={s.id} className="flex items-center gap-2">
					<div
						className={cn(
							"flex size-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
							i < current && "bg-foreground text-background",
							i === current && "bg-foreground text-background",
							i > current && "bg-muted text-muted-foreground",
						)}
					>
						{i < current ? <Check className="size-3" /> : i + 1}
					</div>
					{i < steps.length - 1 && (
						<div
							className={cn(
								"h-px w-6 transition-colors",
								i < current ? "bg-foreground" : "bg-border",
							)}
						/>
					)}
				</div>
			))}
		</div>
	);
}

function WelcomeStep() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>A transparent welcome</CardTitle>
				<CardDescription>
					We believe in being upfront. Over the next few screens we'll show you exactly what we
					collect, who we share it with, and what cookies we set. Everything you'll see is generated
					from the same config that powers our privacy policy — so it's always in sync.
				</CardDescription>
			</CardHeader>
		</Card>
	);
}

function DataStep() {
	const entries = Object.entries(dataCollected);
	return (
		<section className="space-y-3">
			<Header
				icon={<Database className="size-4" />}
				title="What we collect"
				description={
					entries.length > 0
						? `We collect ${entries.length} ${entries.length === 1 ? "category" : "categories"} of information.`
						: "No data categories have been registered yet."
				}
			/>
			{entries.length === 0 ? (
				<EmptyCard message="Nothing is being collected — the dataCollected registry is empty." />
			) : (
				entries.map(([category, fields]) => (
					<Card key={category} size="sm">
						<CardHeader>
							<CardTitle>{category}</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="flex flex-wrap gap-1.5">
								{fields.map((field) => (
									<li
										key={field}
										className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
									>
										{field}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				))
			)}
		</section>
	);
}

function ThirdPartiesStep() {
	return (
		<section className="space-y-3">
			<Header
				icon={<Users className="size-4" />}
				title="Who we share with"
				description={
					thirdParties.length > 0
						? `We rely on ${thirdParties.length} third-party ${thirdParties.length === 1 ? "service" : "services"}.`
						: "We don't share your data with any third parties."
				}
			/>
			{thirdParties.length === 0 ? (
				<EmptyCard message="No third parties detected in your dependencies." />
			) : (
				thirdParties.map((service) => (
					<Card key={service.name} size="sm">
						<CardHeader>
							<CardTitle>{service.name}</CardTitle>
							<CardDescription>{service.purpose}</CardDescription>
						</CardHeader>
						{service.policyUrl && (
							<CardContent>
								<a
									href={service.policyUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-xs text-foreground underline underline-offset-2 hover:opacity-80"
								>
									Their privacy policy
									<ExternalLink className="size-3" />
								</a>
							</CardContent>
						)}
					</Card>
				))
			)}
		</section>
	);
}

function CookiesStep() {
	const entries = Object.entries(cookies);
	return (
		<section className="space-y-3">
			<Header
				icon={<Cookie className="size-4" />}
				title="Cookies we use"
				description="Essential cookies are always on. Everything else is opt-in."
			/>
			<Card size="sm">
				<CardContent className="pt-4">
					<ul className="divide-y">
						{entries.map(([category, enabled]) => (
							<li
								key={category}
								className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
							>
								<span className="text-sm capitalize">{category}</span>
								<span
									className={cn(
										"rounded-full px-2 py-0.5 text-xs font-medium",
										category === "essential"
											? "bg-foreground text-background"
											: enabled
												? "bg-muted text-foreground"
												: "border text-muted-foreground",
									)}
								>
									{category === "essential" ? "Always on" : enabled ? "Default on" : "Opt-in"}
								</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</section>
	);
}

function DoneStep({ onRestart }: { onRestart: () => void }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>You're all set</CardTitle>
				<CardDescription>
					That's everything. For the full legal text, see our{" "}
					<Link to="/tailwind" className="underline underline-offset-2 hover:opacity-80">
						privacy policy
					</Link>
					.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" onClick={onRestart}>
					Start over
				</Button>
			</CardContent>
		</Card>
	);
}

function Header({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="mb-2">
			<div className="mb-1 flex items-center gap-2 text-sm font-medium">
				{icon}
				{title}
			</div>
			<p className="text-xs text-muted-foreground">{description}</p>
		</div>
	);
}

function EmptyCard({ message }: { message: string }) {
	return (
		<Card size="sm">
			<CardContent className="py-4 text-center text-sm text-muted-foreground">
				{message}
			</CardContent>
		</Card>
	);
}
