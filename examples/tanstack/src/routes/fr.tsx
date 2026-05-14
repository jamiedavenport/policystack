import { CookiePolicy, PrivacyPolicy } from "@openpolicy/react";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fr")({ component: RouteComponent });

const policyStyles = cn(
	"**:data-op-section:mb-10 **:data-op-section:border-b **:data-op-section:border-border **:data-op-section:pb-10",
	"**:data-op-heading:text-xl **:data-op-heading:font-semibold **:data-op-heading:tracking-tight **:data-op-heading:mb-4",
	"**:data-op-paragraph:text-sm **:data-op-paragraph:text-muted-foreground **:data-op-paragraph:leading-relaxed **:data-op-paragraph:mb-3",
	"**:data-op-list:list-disc **:data-op-list:list-inside **:data-op-list:space-y-1 **:data-op-list:text-sm **:data-op-list:text-muted-foreground **:data-op-list:mb-3",
	"**:data-op-table:w-full **:data-op-table:border **:data-op-table:border-border **:data-op-table:border-collapse **:data-op-table:text-sm **:data-op-table:my-3",
	"**:data-op-table-header:bg-muted/50",
	"**:data-op-table-row:border-b **:data-op-table-row:border-border **:data-op-table-row:last:border-b-0",
	"**:data-op-table-cell:border **:data-op-table-cell:border-border **:data-op-table-cell:px-3 **:data-op-table-cell:py-2 **:data-op-table-cell:align-top **:data-op-table-cell:text-left",
);

function RouteComponent() {
	// Same config the rest of the app uses (set in __root.tsx via <OpenPolicy>),
	// but a `locale` prop on each component overrides config.locale at compile
	// time. OpenPolicy-emitted strings (headings, table headers, GDPR/CCPA
	// disclosures, effective date) render in French; user-supplied strings
	// (purposes, retention, third-party purposes, etc.) pass through in
	// whichever language the config wrote them.
	return (
		<div className="mx-auto max-w-6xl px-6 py-8" lang="fr">
			<div className="mb-8">
				<div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
					<span aria-hidden="true">🇫🇷</span>
					<span className="font-mono">locale="fr"</span>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight">Exemple en français</h1>
				<p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
					Même <code className="font-mono text-xs">defineConfig()</code> que le reste de la démo,
					mais les composants reçoivent <code className="font-mono text-xs">locale="fr"</code>.
					OpenPolicy traduit les intitulés, les en-têtes de tableaux et les textes RGPD ; les
					chaînes que vous fournissez (finalités, durées de conservation, etc.) sont rendues telles
					quelles.
				</p>
			</div>
			<div className="grid grid-cols-2 gap-8">
				<div className={policyStyles}>
					<PrivacyPolicy locale="fr" />
				</div>
				<div className={policyStyles}>
					<CookiePolicy locale="fr" />
				</div>
			</div>
		</div>
	);
}
