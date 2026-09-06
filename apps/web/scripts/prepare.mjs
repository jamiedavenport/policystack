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

This notice covers the public PolicyStack website. The site has no account registration, Databuddy analytics, or Offstage integration. Documentation search runs locally in your browser. The interface may remember display preferences in browser storage. Hosting providers process requests to deliver the site.

${renderMarkdown(document).replace(/^# .+\n/, "")}
`,
);
