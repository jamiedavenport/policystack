import { PrivacyPolicy } from "@policystack/react/policy";
import { policyComponents } from "../components/policyComponents";

// The privacy policy renders as a plain React tree from the same config that
// drives the consent runtime — through the app's own components (see
// src/components/policyComponents.tsx).
export function PrivacyPolicyPage() {
  return (
    <main className="policy">
      <PrivacyPolicy components={policyComponents} />
    </main>
  );
}
