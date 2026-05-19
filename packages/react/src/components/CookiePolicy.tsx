import { compileCookiePolicy } from "@policystack/core";
import { PolicyDocument, type PolicyDocumentProps } from "./PolicyDocument";

export function CookiePolicy(props: PolicyDocumentProps) {
	return <PolicyDocument {...props} compile={compileCookiePolicy} />;
}
