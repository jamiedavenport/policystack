---
"@policystack/core": minor
---

Add `"signup"` to the `ConsentRecordSource` union so consent captured during
account signup can be distinguished from banner, preferences, API, and import
sources in `ConsentRecord.source`.
