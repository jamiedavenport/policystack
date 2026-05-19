# @policystack/svelte

## 1.0.1

## 0.0.34

## 0.0.33

### Patch Changes

- 4c96c2c: Add `compilePrivacyPolicy(config)` and `compileCookiePolicy(config)` helpers to `@policystack/core` that take an `OpenPolicyConfig` and return `Document | null` directly — eliminating the `expandOpenPolicyConfig(config).find((i) => i.type === ...)` + null-check dance at every call site. The helpers return `null` when the category should not be emitted (e.g. `policies: ["privacy"]` excludes cookie), keeping the "what does missing mean?" decision with the consumer. The React, Vue, and Svelte bindings now use these helpers internally.

## 0.0.32

## 0.0.31

## 0.0.30

### Patch Changes

- 1d0ca66: Add `@policystack/svelte` — native Svelte 5 components for rendering OpenPolicy privacy and cookie policies.

  ```svelte
  <script lang="ts">
  import { OpenPolicy, PrivacyPolicy } from "@policystack/svelte";
  import config from "../openpolicy";
  </script>

  <OpenPolicy {config}>
    <PrivacyPolicy />
  </OpenPolicy>
  ```

  The package mirrors the React and Vue integrations: `<OpenPolicy>` provides config via context, `<PrivacyPolicy>` and `<CookiePolicy>` render the compiled document, and any default renderer can be replaced by passing a snippet prop (`heading`, `paragraph`, `list`, `table`, etc.). Works with SvelteKit SSR.

  The CLI also detects `svelte` in `package.json` and installs `@policystack/svelte` automatically during `openpolicy init`.
