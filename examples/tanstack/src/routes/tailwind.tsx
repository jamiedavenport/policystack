import { CookiePolicy, PrivacyPolicy } from "@policystack/react/policy";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tailwind")({
	component: RouteComponent,
});

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
	return (
		<div className="grid grid-cols-2 gap-8 py-12 px-8">
			<div className={policyStyles}>
				<PrivacyPolicy />
			</div>
			<div className={policyStyles}>
				<CookiePolicy />
			</div>
		</div>
	);
}
