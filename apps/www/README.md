# www — redirect shim

This workspace used to host the Astro site at **openpolicy.sh**. OpenPolicy has folded into [PolicyStack](https://policystack.dev), and this directory now contains nothing but a Vercel `redirects` map that 308/307s every public URL to its new home.

The Vercel project attached to the `openpolicy.sh` domain continues to deploy from here — Vercel evaluates `vercel.json` `redirects` before any build output, so no server runtime is needed.

See [`/MIGRATION.md`](../../MIGRATION.md) for the full redirect table, the rationale behind the 301-vs-302 split, and the flip-day checklist. When a 302 (307) target gets a real canonical post on PolicyStack, promote its entry in both `MIGRATION.md` and `vercel.json` to `"permanent": true`.
