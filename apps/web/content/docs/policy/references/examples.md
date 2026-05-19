---
title: Examples
description: Example projects using Policy
product: policy
---

Example projects live in the [GitHub repository](https://github.com/jamiedavenport/policystack/tree/main/examples).

| Example                                                                               | Stack                                                      |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [TanStack](https://github.com/jamiedavenport/policystack/tree/main/examples/tanstack) | TanStack Start + `@policystack/react` + `@policystack/sdk` |

The PolicyStack site itself ([`apps/web`](https://github.com/jamiedavenport/policystack/tree/main/apps/web)) is also a working reference: it dogfoods `@policystack/{react,sdk}`, rendering [`/privacy`](/privacy) from a typed `policystack.ts` and gating analytics behind a consent banner derived from the same config.
