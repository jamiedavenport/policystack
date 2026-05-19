# www — redirect shim

This workspace used to host the Astro site at **openpolicy.sh**. OpenPolicy has folded into [PolicyStack](https://policystack.dev), and this directory now contains nothing but a Vercel `redirects` map that 308/307s every public URL to its new home.

The Vercel project attached to the `openpolicy.sh` domain continues to deploy from here — Vercel evaluates `vercel.json` `redirects` before any build output, so no server runtime is needed.

`vercel.json` is the single source of truth for the redirect table and the
301-vs-302 split: a `"permanent": true` entry is a canonical move (the new URL
is the real home), a temporary one is a placeholder until the canonical
PolicyStack page exists. When a temporary target gets a real canonical post on
PolicyStack, promote its `vercel.json` entry to `"permanent": true`.
