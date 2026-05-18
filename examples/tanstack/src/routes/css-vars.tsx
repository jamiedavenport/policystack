import { CookiePolicy, PrivacyPolicy } from "@policystack/react/policy";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/css-vars")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<style>{`
        .policy-css-vars {
          --policy-heading-size: 1.25rem;
          --policy-heading-weight: 600;
          --policy-heading-color: oklch(0.145 0 0);
          --policy-text-size: 0.875rem;
          --policy-text-color: oklch(0.556 0 0);
          --policy-section-gap: 2.5rem;
          --policy-section-border: oklch(0.922 0 0);
        }
        .policy-css-vars [data-op-section] { margin-bottom: var(--policy-section-gap); padding-bottom: var(--policy-section-gap); border-bottom: 1px solid var(--policy-section-border); }
        .policy-css-vars [data-op-heading] { font-size: var(--policy-heading-size); font-weight: var(--policy-heading-weight); color: var(--policy-heading-color); margin-bottom: 1rem; }
        .policy-css-vars [data-op-paragraph] { font-size: var(--policy-text-size); color: var(--policy-text-color); line-height: 1.625; margin-bottom: 0.75rem; }
        .policy-css-vars [data-op-list] { list-style-type: disc; list-style-position: inside; font-size: var(--policy-text-size); color: var(--policy-text-color); margin-bottom: 0.75rem; }
      `}</style>
			<div className="grid grid-cols-2 gap-8 py-12 px-8">
				<div className="policy-css-vars">
					<PrivacyPolicy />
				</div>
				<div className="policy-css-vars">
					<CookiePolicy />
				</div>
			</div>
		</>
	);
}
