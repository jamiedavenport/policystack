import { useCategory, useConsent } from "@policystack/react/consent";

function AnalyticsToggle() {
  const { granted, toggle } = useCategory("analytics");
  return (
    <label className="cookie-toggle">
      <span>Analytics</span>
      <input type="checkbox" checked={granted} onChange={toggle} />
    </label>
  );
}

// The detail panel: one toggle per consent-gated category. `toggle` flips a
// category in the store's draft; `save` commits it as a versioned, timestamped
// ConsentRecord.
export function CookiePreferences() {
  const { route, save, setRoute } = useConsent();
  if (route !== "preferences") return null;

  return (
    <div className="cookie-preferences-backdrop">
      <div className="cookie-preferences" role="dialog" aria-label="Cookie preferences">
        <h2>Cookie preferences</h2>
        <label className="cookie-toggle">
          <span>Essential (always on)</span>
          <input type="checkbox" checked disabled />
        </label>
        <AnalyticsToggle />
        <div className="cookie-banner-buttons">
          <button
            type="button"
            className="button button-outlined"
            onClick={() => setRoute("cookie")}
          >
            Back
          </button>
          <button type="button" className="button button-filled" onClick={() => save()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
