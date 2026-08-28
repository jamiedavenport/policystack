---
"@policystack/core": minor
"@policystack/sdk": minor
---

Preserve all 50 US states as canonical jurisdictions so the built-in geo resolver can correctly apply the current legally required GPC scope. The exported `GPC_LEGALLY_REQUIRED_JURISDICTIONS` list is now derived from jurisdiction capabilities and covers California, Colorado, Connecticut, Delaware, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, and Texas. Core also exports the canonical `US_STATE_JURISDICTION_IDS` list and `isUSStateJurisdictionId()` guard, while unknown-jurisdiction diagnostics use compact state-code guidance instead of enumerating all 57 ids.
