---
title: Overview
description: The policy types supported by Policy
product: policy
---

Policy supports two policy types, rendered independently from a single flat config.

| Policy         | Detected from                     |
| -------------- | --------------------------------- |
| Privacy Policy | `data`, `children`                |
| Cookie Policy  | `cookies`, `trackingTechnologies` |

Each policy is optional — Policy auto-detects which to produce based on the fields you provide. The `company` block and shared fields (`effectiveDate`, `jurisdictions`) live at the top level and apply to every policy rendered.
