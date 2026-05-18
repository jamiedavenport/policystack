import { describe, expect, it } from "vite-plus/test";
import { applySuppressions } from "./suppress";
import type { Hit, ParsedComment } from "./types";

function cookie(line: number): Hit {
	return { file: "x.ts", line, column: 0, kind: "document.cookie" };
}

function lineComment(value: string, line: number): ParsedComment {
	return { type: "Line", value, line };
}

describe("applySuppressions", () => {
	it("returns hits unchanged when no comments", () => {
		const hits = [cookie(5)];
		expect(applySuppressions(hits, [])).toEqual(hits);
	});

	it("drops hit on the line after ignore-next-line", () => {
		const hits = [cookie(5)];
		const comments = [lineComment(" policystack-ignore-next-line", 4)];
		expect(applySuppressions(hits, comments)).toEqual([]);
	});

	it("does not drop a hit two lines after ignore-next-line", () => {
		const hits = [cookie(7)];
		const comments = [lineComment(" policystack-ignore-next-line", 4)];
		expect(applySuppressions(hits, comments)).toEqual(hits);
	});

	it("drops every hit when ignore-file appears in first 10 lines", () => {
		const hits = [cookie(5), cookie(20)];
		const comments = [lineComment(" policystack-ignore-file", 2)];
		expect(applySuppressions(hits, comments)).toEqual([]);
	});

	it("ignores ignore-file past line 10", () => {
		const hits = [cookie(50)];
		const comments = [lineComment(" policystack-ignore-file", 20)];
		expect(applySuppressions(hits, comments)).toEqual(hits);
	});
});
