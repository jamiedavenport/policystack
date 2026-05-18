import type { PolicyStackConfig } from "@policystack/core";
import { createContext, type ReactNode } from "react";

type PolicyStackContextValue = {
	config: PolicyStackConfig | null;
};

export const PolicyStackContext = createContext<PolicyStackContextValue>({
	config: null,
});

type PolicyStackProps = {
	config: PolicyStackConfig;
	children?: ReactNode;
};

export function PolicyStack({ config, children }: PolicyStackProps) {
	return <PolicyStackContext.Provider value={{ config }}>{children}</PolicyStackContext.Provider>;
}
