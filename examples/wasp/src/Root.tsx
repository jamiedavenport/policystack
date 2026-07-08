import { PolicyStack } from "@policystack/react/provider";
import { Outlet } from "react-router";
import { Link } from "wasp/client/router";
import { CookieBanner } from "./components/CookieBanner";
import { CookiePreferences } from "./components/CookiePreferences";
import "./Main.css";
import config from "./policystack";

// Wasp renders this around every page (client.rootComponent in main.wasp.ts);
// the current page mounts at <Outlet />. One provider supplies the policy
// context AND, because the config declares consent-gated cookies, the consent
// store the banner reads from.
export default function Root() {
  return (
    <PolicyStack config={config}>
      <header className="site-header">
        <Link to="/" className="site-name">
          PolicyStack × Wasp
        </Link>
        <nav className="site-nav">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
        </nav>
      </header>

      <Outlet />

      <footer className="site-footer">
        <span>
          Built with <a href="https://policystack.dev">PolicyStack</a> +{" "}
          <a href="https://wasp.sh">Wasp</a>
        </span>
      </footer>

      <CookieBanner />
      <CookiePreferences />
    </PolicyStack>
  );
}
