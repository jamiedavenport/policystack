# OpenPolicy bench

Bundle, network, and runtime benchmark for OpenPolicy. Measures the delta that OpenPolicy adds to a TanStack Start app: the privacy-policy and cookie-policy routes, the shadcn cookie banner, the compiled policy HTML, and the `@openpolicy/vite` plugin.

## Running

```sh
pnpm run bench                  # full: bundle + 5-iteration runtime
pnpm run bench:bundle           # bundle size only (no browser)
pnpm run bench:runtime          # runtime only
pnpm run bench -- --iterations=10
```

Results are written to `scripts/bench/results/latest.{json,md}`.

## What gets compared

Two scenarios are built from `examples/tanstack`:

| Scenario     | Description                                                                                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **full**     | The example as-shipped: `<OpenPolicy>` provider, privacy/cookie routes, shadcn cookie banner, `openPolicy()` Vite plugin, compiled policy HTML.                                              |
| **baseline** | Same TanStack Start shell with OpenPolicy removed: `__root.tsx` is stripped of the provider, policy routes and `src/policies/` are deleted, `openPolicy()` is removed from `vite.config.ts`. |

The **Δ between the two is OpenPolicy's impact**. We measure both so the number is explainable.

## Metrics

### Bundle (deterministic, one sample)

Walks `examples/tanstack/.output/public/` and tallies every asset, classified as `js | css | html | font | image | other`, with raw / gzip-9 / brotli-11 sizes.

### Runtime (N=5 by default, median + p95 reported)

Playwright + Chrome DevTools Protocol against `node .output/server/index.mjs`:

- **TTFB** — `ResourceTiming.responseStart` of the document request.
- **FCP** — `PerformanceObserver('paint')`.
- **LCP** — last `largest-contentful-paint` entry after a 3 s settle window.
- **CLS** — sum of `layout-shift` entries excluding those with `hadRecentInput`.
- **load event** — navigation to `load` in ms.
- **JS exec** — `Profiler.start` / `.stop` from CDP, 100 µs sampling, sum of hit counts × interval.
- **transfer / requests** — `Network.loadingFinished` encodedDataLength and count.

## Mechanics

1. Assert `examples/tanstack` is clean in git (fail fast — won't trample uncommitted work).
2. Build the `full` scenario (no mutations), measure, start preview, sample, stop preview.
3. Apply the `baseline` scenario in-place: overwrite `__root.tsx`, `index.tsx`, `vite.config.ts`; delete the policy-coupled routes and `src/policies/`; delete the generated route tree.
4. Build, measure, sample as above.
5. `git checkout HEAD -- examples/tanstack && git clean -fd examples/tanstack` to restore.
6. Write `results/latest.json` and `results/latest.md`.

A `try/finally` in the orchestrator ensures restore runs even if a build fails.

## Known caveats

- **Machine-dependent** — runtime metrics reflect the host's CPU and disk speed. Compare runs on the same machine. A CI-stable version would run in a fixed GitHub Actions environment (follow-up).
- **No network throttling** — all requests are loopback. Transfer sizes are accurate; latency is not representative.
- **Profiler JS-exec is a rough proxy** — 100 µs sampling means bursts under 100 µs are missed. Good for scenario comparison, not absolute profiling.
- **Initial-vs-dynamic JS** is not broken out yet — totals include all chunks emitted by Vite/Nitro, even lazily-loaded ones. Follow-up: parse the client manifest to split initial vs on-demand.

## Extending to other frameworks

The scenarios machinery in `scenarios.ts` is parameterised by example directory and patch set. To add `examples/nextjs`, `examples/astro`, etc.: create a sibling patches dir, define the file replacements + deletions, and add a case to `scenarios`.
