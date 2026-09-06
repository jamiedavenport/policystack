import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { compilePrivacyPolicy } from "@policystack/core";
import { renderMarkdown } from "@policystack/renderers";
import { renderLlmsTxt } from "@policystack/sdk";
import policy from "../policystack.ts";

process.chdir(fileURLToPath(new URL("..", import.meta.url)));
await mkdir("public", { recursive: true });
await writeFile("public/sdk.txt", renderLlmsTxt());
const document = compilePrivacyPolicy(policy);
if (!document) throw new Error("Website privacy policy must be generated");
await writeFile(
	"content/privacy.md",
	`---
title: Privacy policy
description: How the PolicyStack website handles information and enquiries.
ai:
  exclude: true
search:
  exclude: true
---

This notice covers the public PolicyStack website. We use OpenPanel to measure page views and outgoing link clicks, including page URLs, referrers, browser and device information, and approximate location. We do not send account identities or enable session replay. OpenPanel does not use tracking cookies; it processes IP addresses to derive location and anonymous visitor identifiers without storing the raw IP addresses. Documentation search runs locally in your browser. The interface may remember display preferences in browser storage. Hosting providers process requests to deliver the site.

${renderMarkdown(document).replace(/^# .+\n/, "")}
`,
);
