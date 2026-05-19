import { compilePrivacyPolicy } from "@policystack/core";
import { PolicyDocument, type PolicyDocumentProps } from "./PolicyDocument";

export function PrivacyPolicy(props: PolicyDocumentProps) {
	return <PolicyDocument {...props} compile={compilePrivacyPolicy} />;
}
