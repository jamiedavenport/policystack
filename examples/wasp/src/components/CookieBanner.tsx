import { useConsent } from "@policystack/react/consent";

// The banner is just a component reading the consent store. `route` is the
// store's view of which surface should be visible: "cookie" for the banner,
// "preferences" for the detail panel, "closed" once a decision is on file.
export function CookieBanner() {
  const { route, acceptAll, acceptNecessary, setRoute } = useConsent();
  if (route !== "cookie") return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <p>
        We use cookies to keep this app running and, with your permission, to understand how it is
        used. Read the <a href="/cookie-policy">cookie policy</a>.
      </p>
      <div className="cookie-banner-buttons">
        <button type="button" className="button button-outlined" onClick={() => acceptNecessary()}>
          Necessary only
        </button>
        <button
          type="button"
          className="button button-outlined"
          onClick={() => setRoute("preferences")}
        >
          Customize
        </button>
        <button type="button" className="button button-filled" onClick={() => acceptAll()}>
          Accept all
        </button>
      </div>
    </div>
  );
}
