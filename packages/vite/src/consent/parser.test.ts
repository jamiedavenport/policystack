import { describe, expect, it } from "vite-plus/test";
import { parseFile, positionFor } from "./parser";
import { extractScripts } from "./sfc";

describe("parseFile", () => {
	it("parses a TS file", () => {
		const r = parseFile("a.ts", "const x: number = 1;\ndocument.cookie = 'a';");
		expect(r).not.toBeNull();
		expect(r?.lang).toBe("ts");
		expect(r?.ast.type).toBe("Program");
	});

	it("parses TSX with JSX", () => {
		const r = parseFile("a.tsx", "const C = () => <div>hi</div>;");
		expect(r?.lang).toBe("tsx");
	});

	it("returns null for unsupported extensions", () => {
		expect(parseFile("a.css", "body{}")).toBeNull();
	});

	it("captures comments with absolute line numbers", () => {
		const src = "// hi\nconst x = 1;\n// policystack-ignore-next-line\ndocument.cookie='a';";
		const r = parseFile("a.ts", src);
		expect(r?.comments.map((c) => c.line)).toEqual([1, 3]);
	});

	it("parses a Vue SFC <script> block", () => {
		const src = `<template><div /></template>\n<script setup lang="ts">\ndocument.cookie = 'a';\n</script>`;
		const r = parseFile("a.vue", src);
		expect(r).not.toBeNull();
		expect(r?.lineOffset).toBe(1);
	});

	it("parses a Svelte SFC <script> block", () => {
		const src = `<script lang="ts">\nlet x = 1;\n</script>\n<div>{x}</div>`;
		const r = parseFile("a.svelte", src);
		expect(r).not.toBeNull();
		expect(r?.lang).toBe("ts");
	});
});

describe("extractScripts", () => {
	it("extracts a single script block with line offset", () => {
		const blocks = extractScripts(
			"<template>\n  <div/>\n</template>\n<script>\nconsole.log(1);\n</script>",
		);
		expect(blocks).toHaveLength(1);
		expect(blocks[0]?.startLine).toBe(3);
		expect(blocks[0]?.source.trim()).toBe("console.log(1);");
	});

	it("respects lang attribute", () => {
		const blocks = extractScripts(`<script lang="ts">const x: number = 1;</script>`);
		expect(blocks[0]?.lang).toBe("ts");
	});
});

describe("positionFor", () => {
	it("returns 1-indexed line and 0-indexed column", () => {
		expect(positionFor("ab\ncd", 0)).toEqual({ line: 1, column: 0 });
		expect(positionFor("ab\ncd", 3)).toEqual({ line: 2, column: 0 });
		expect(positionFor("ab\ncd", 4)).toEqual({ line: 2, column: 1 });
	});
});
