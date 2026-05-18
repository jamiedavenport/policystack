import { CookiePolicy, PrivacyPolicy } from "@policystack/react/policy";
import type { ReactNode } from "react";
import type { Locale } from "@policystack/sdk";
import { cn } from "@/lib/utils";

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

type LocalizedPolicyProps = {
	locale: Locale;
	flag: string;
	title: string;
	tagline: ReactNode;
};

// Re-uses the same English config set on <PolicyStack> in __root.tsx.
// The `locale` prop on PrivacyPolicy/CookiePolicy overrides config.locale at
// compile time — PolicyStack translates the strings it emits (headings, table
// headers, GDPR/CCPA disclosures, the formatted effective date) while
// user-supplied content (purposes, retention text, etc.) is passed through
// in whatever language the config wrote it.
export function LocalizedPolicy({ locale, flag, title, tagline }: LocalizedPolicyProps) {
	return (
		<div className="mx-auto max-w-6xl px-6 py-8" lang={locale}>
			<div className="mb-8">
				<div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
					<span aria-hidden="true">{flag}</span>
					<span className="font-mono">locale="{locale}"</span>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
				<p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">{tagline}</p>
			</div>
			<div className="grid grid-cols-2 gap-8">
				<div className={policyStyles}>
					<PrivacyPolicy locale={locale} />
				</div>
				<div className={policyStyles}>
					<CookiePolicy locale={locale} />
				</div>
			</div>
		</div>
	);
}
