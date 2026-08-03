---
"@policystack/scripts": minor
"@policystack/vite": minor
---

Add a Microsoft Clarity integration: a consent-gated `clarity()` script factory (`@policystack/scripts/clarity`) that queues the required `consentv2` signal before the tag loads, and a `microsoft-clarity` vendor record in the scanner registry so ungated `clarity(...)` usage is detected and disclosed.
