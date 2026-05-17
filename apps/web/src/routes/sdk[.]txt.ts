import { renderLlmsTxt } from "@openpolicy/sdk";
import { createFileRoute } from "@tanstack/react-router";
import { PLAIN_HEADERS } from "../lib/llms";

// The canonical, type-generated SDK reference (PS-27). `renderLlmsTxt()` is the
// single source of truth — the same function the `@openpolicy/sdk` package
// snapshots into its shipped `llms.txt` and the CLI writes into a project.
export const Route = createFileRoute("/sdk.txt")({
	server: {
		handlers: {
			GET: () => new Response(renderLlmsTxt(), { headers: PLAIN_HEADERS }),
		},
	},
});
