import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { CONSENT_REGISTRY } from "../../registry";
import { loadFixtures, partition } from "../test-helpers";
import { parseFile } from "../parser";
import { walk } from "../visit";
import { vendorImportsRule } from "./vendor-imports";

const FIXTURES = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"__fixtures__",
	"rules",
	"vendor-imports",
);

const registry = CONSENT_REGISTRY;

describe("vendor-imports rule", () => {
	for (const fx of loadFixtures(FIXTURES)) {
		it(fx.name, () => {
			const parsed = parseFile(fx.file, fx.source)!;
			const { hits } = walk(parsed, [vendorImportsRule], registry);
			const got = partition(hits);
			const expected = fx.expected;
			expect(got.vendors).toHaveLength(expected.vendors.length);
			for (let i = 0; i < expected.vendors.length; i++) {
				expect(got.vendors[i]).toMatchObject(expected.vendors[i]!);
			}
		});
	}
});
