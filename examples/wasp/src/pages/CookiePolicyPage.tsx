import { CookiePolicy } from "@policystack/react/policy";
import { policyComponents } from "../components/policyComponents";

export function CookiePolicyPage() {
  return (
    <main className="policy">
      <CookiePolicy components={policyComponents} />
    </main>
  );
}
