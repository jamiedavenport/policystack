---
title: Overview
description: The policy types supported by Policy
---

> **PolicyStack V1** — current documentation. [Supported capabilities and limitations](/docs/reference/support).

Policy supports two policy types, rendered independently from a single flat config.

| Policy         | Detected from      |
| -------------- | ------------------ |
| Privacy Policy | `data`, `children` |
| Cookie Policy  | `cookies`          |

Each policy is optional — Policy auto-detects which to produce based on the fields you provide. The `company` block and shared fields (`effectiveDate`, `jurisdictions`) live at the top level and apply to every policy rendered.
