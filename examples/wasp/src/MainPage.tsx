import { ConsentGate, useConsent } from "@policystack/react/consent";
import { useEffect } from "react";
import Logo from "./assets/logo.svg";

export function MainPage() {
  const consent = useConsent();

  // A stand-in for a real analytics SDK: only sets its cookie once the
  // visitor has granted the "analytics" category. The `consent.has()` guard
  // is also what the @policystack/vite scanner recognises as a gated write.
  useEffect(() => {
    if (consent.has("analytics")) {
      document.cookie = "demo_analytics=1; path=/; max-age=7776000";
    }
  }, [consent]);

  return (
    <main className="container">
      <img className="logo" src={Logo} alt="wasp" />

      <h2 className="title">Wasp + PolicyStack</h2>

      <p className="content">
        This Wasp app ships a privacy policy, a cookie policy, and a consent banner from one{" "}
        <code>defineConfig()</code> in <code>src/policystack.ts</code>. Clear the decision below to
        see the banner again.
      </p>

      <ConsentGate
        requires="analytics"
        fallback={<p className="content">Analytics is off — enable it in cookie preferences.</p>}
      >
        <p className="content">
          Analytics is on — the <code>demo_analytics</code> cookie is set.
        </p>
      </ConsentGate>

      <div className="buttons">
        <button
          type="button"
          className="button button-filled"
          onClick={() => consent.setRoute("preferences")}
        >
          Cookie preferences
        </button>
        <a className="button button-outlined" href="/privacy-policy">
          Privacy Policy
        </a>
      </div>
    </main>
  );
}
