import type { PolicyExtractor } from "../../analyse";
import type { Rule } from "../types";

/**
 * The `@openpolicy/sdk` policy extraction (`collecting` / `thirdParty` /
 * `defineCookie` / `sharing`) expressed as a rule in the one unified walk
 * (PS-25). It does not duplicate the algorithm: the per-file
 * {@link PolicyExtractor} owns it (shared with the legacy `extractFromParsed`
 * unit path); this rule just feeds each visited node to that extractor.
 *
 * It never calls `ctx.report`, so policy calls never enter the consent
 * ungated channel — policy and consent reporting stay separate paths through
 * the same traversal. The driver constructs one extractor per file (so the
 * within-file dedup state is per-file) and reads `extractor.result()` after
 * the walk.
 */
export function makeOpenPolicyRule(extractor: PolicyExtractor): Rule {
	return {
		name: "openpolicy",
		visit: (ctx) => extractor.visit(ctx.node),
	};
}
