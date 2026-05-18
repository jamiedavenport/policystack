import { CookiePolicy, PrivacyPolicy } from "@policystack/react/policy";
import { createFileRoute } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/shadcn")({ component: RouteComponent });

const components = {
	Heading: ({ node }: { node: { value: string; context?: { reason?: string } } }) => {
		if (node.context?.reason) {
			return (
				<Tooltip>
					<TooltipTrigger className="mb-3">
						<h2 className="text-2xl font-bold border-b-2 border-dashed border-blue-200 hover:border-blue-400">
							{node.value}
						</h2>
					</TooltipTrigger>
					<TooltipContent side="right">{node.context.reason}</TooltipContent>
				</Tooltip>
			);
		}
		return <h2 className="text-2xl font-bold mb-3">{node.value}</h2>;
	},
};

function RouteComponent() {
	return (
		<div className="grid grid-cols-2 gap-8 py-12 px-8">
			<PrivacyPolicy components={components} />
			<CookiePolicy components={components} />
		</div>
	);
}
