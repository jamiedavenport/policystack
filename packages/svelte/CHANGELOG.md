# @openpolicy/svelte

## 0.0.32

## 0.0.31

## 0.0.30

### Patch Changes

- 1d0ca66: Add `@openpolicy/svelte` — native Svelte 5 components for rendering OpenPolicy privacy and cookie policies.

  ```svelte
  <script lang="ts">
  import { OpenPolicy, PrivacyPolicy } from "@openpolicy/svelte";
  import config from "../openpolicy";
  </script>

  <OpenPolicy {config}>
    <PrivacyPolicy />
  </OpenPolicy>
  ```

  The package mirrors the React and Vue integrations: `<OpenPolicy>` provides config via context, `<PrivacyPolicy>` and `<CookiePolicy>` render the compiled document, and any default renderer can be replaced by passing a snippet prop (`heading`, `paragraph`, `list`, `table`, etc.). Works with SvelteKit SSR.

  The CLI also detects `svelte` in `package.json` and installs `@openpolicy/svelte` automatically during `openpolicy init`.
