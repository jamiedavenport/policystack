# Astro example

This workspace example shows PolicyStack's Vite plugin in an Astro application with React, Tailwind, a prerendered page, and a deferred server island. It uses the local `@policystack/vite` package, so it is suitable for developing and validating the current plugin alongside Astro.

The page is explicitly prerendered and uses a deferred Astro component. That server island contains a React component hydrated with `client:load`.

The `/privacy` route prerenders the same application's privacy policy with
`@policystack/react`.

## Run

From the repository root:

```sh
pnpm install
vp run -r build
pnpm --filter astro-example dev
```

The recursive build prepares the workspace `@policystack/*` packages consumed
by this example. CI runs the same command before building examples.

Build the production application with:

```sh
pnpm --filter astro-example build
```

## Issue #155 reproduction

This example also preserves the setup from [issue #155](https://github.com/jamiedavenport/policystack/issues/155), where the PolicyStack Vite plugin can shift Astro's dependency-optimizer startup timing enough to break React hydration inside a server island.

Run the dev server with a forced dependency optimization pass:

```sh
pnpm --filter astro-example dev:repro
```

Open the printed local URL and inspect the browser console. On affected Astro/Vite combinations, hydration can fail with an error resembling:

```text
[astro-island] Error hydrating ... react-dom/client.js ... doesn't provide an export named: 'createRoot'
```

`dev:repro` runs Astro with `--force`, which forces dependency optimization for each run and gives the race a clean optimizer startup. The issue is timing-dependent, so a failed hydration is not guaranteed on every run.

## Comparison workaround

To compare against the known workaround, add this inside the `vite` object in `astro.config.ts`:

```ts
environments: {
  client: {
    optimizeDeps: {
      noDiscovery: true,
      include: ["react", "react-dom", "react-dom/client"],
    },
  },
},
```

The `include` list must cover every dependency required by hydrated islands in a real application. It is intentionally not enabled by default, so the example can exercise the affected startup path.
