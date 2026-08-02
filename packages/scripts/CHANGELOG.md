# @policystack/scripts

## 1.3.0

### Minor Changes

- 74ab73b: `gateScript` now follows the official vendor snippet order, fixing gated scripts that never fired (#156). On consent it restores the stubbed globals, runs `init`, replays the pre-consent queue, and only then injects the script; `script:loaded` fires only after the script's real load event, and calls made while the script downloads are no longer dropped. The shipped Meta Pixel, PostHog, Segment, and Hotjar integrations now create their vendor's official snippet stub in `init`, so scripts like `fbevents.js` — which decorate the existing global and drain its queue rather than replacing it — bootstrap correctly in both the gated and already-granted paths.

  **Migration for custom `defineScript` definitions:** `init` now runs _before_ the script is injected (previously after). Mirror the vendor's inline snippet: create the vendor's own queueing stub and make the initial calls there.

## 1.2.0

## 1.1.0

## 1.0.1
