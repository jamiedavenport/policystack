import { expect, test } from "vite-plus/test";
import { AST_VERSION, type Document } from "@openpolicy/core";
import { renderMarkdown } from "./markdown";

function doc(sections: Document["sections"]): Document {
	return { type: "document", astVersion: AST_VERSION, policyType: "privacy", sections };
}

test("renders a heading node", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [{ type: "heading", value: "Introduction" }],
			},
		]),
	);
	expect(result).toBe("## Introduction");
});

test("renders a paragraph with text", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "paragraph",
						children: [{ type: "text", value: "Hello world" }],
					},
				],
			},
		]),
	);
	expect(result).toBe("Hello world");
});

test("renders bold and link inline nodes", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "paragraph",
						children: [
							{ type: "bold", value: "Important" },
							{ type: "text", value: ": see " },
							{ type: "link", href: "https://example.com", value: "here" },
						],
					},
				],
			},
		]),
	);
	expect(result).toBe("**Important**: see [here](https://example.com)");
});

test("renders a list with items", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "list",
						items: [
							{
								type: "listItem",
								children: [{ type: "text", value: "Alpha" }],
							},
							{
								type: "listItem",
								children: [{ type: "text", value: "Beta" }],
							},
						],
					},
				],
			},
		]),
	);
	expect(result).toBe("- Alpha\n- Beta");
});

test("renders nested list with indented items", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "list",
						items: [
							{
								type: "listItem",
								children: [
									{ type: "text", value: "Parent" },
									{
										type: "list",
										items: [
											{
												type: "listItem",
												children: [{ type: "text", value: "Child" }],
											},
										],
									},
								],
							},
						],
					},
				],
			},
		]),
	);
	expect(result).toBe("- Parent\n  - Child");
});

test("joins multiple sections with dividers", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [{ type: "heading", value: "One" }],
			},
			{
				type: "section",
				id: "s2",
				content: [{ type: "heading", value: "Two" }],
			},
		]),
	);
	expect(result).toBe("## One\n\n---\n\n## Two");
});

test("renders heading with level 3", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [{ type: "heading", level: 3, value: "Sub-section" }],
			},
		]),
	);
	expect(result).toBe("### Sub-section");
});

test("renders heading with level 1", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [{ type: "heading", level: 1, value: "Title" }],
			},
		]),
	);
	expect(result).toBe("# Title");
});

test("renders ordered list with numbered items", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "list",
						ordered: true,
						items: [
							{
								type: "listItem",
								children: [{ type: "text", value: "First" }],
							},
							{
								type: "listItem",
								children: [{ type: "text", value: "Second" }],
							},
						],
					},
				],
			},
		]),
	);
	expect(result).toBe("1. First\n2. Second");
});

test("renders italic inline node", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "paragraph",
						children: [{ type: "italic", value: "emphasis" }],
					},
				],
			},
		]),
	);
	expect(result).toBe("_emphasis_");
});

test("renders a table as GFM", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "table",
						header: {
							type: "tableHeaderRow",
							cells: [
								{ type: "tableHeaderCell", children: [{ type: "text", value: "Name" }] },
								{ type: "tableHeaderCell", children: [{ type: "text", value: "Purpose" }] },
							],
						},
						rows: [
							{
								type: "tableRow",
								cells: [
									{ type: "tableCell", children: [{ type: "bold", value: "Acme" }] },
									{ type: "tableCell", children: [{ type: "text", value: "Auth" }] },
								],
							},
						],
					},
				],
			},
		]),
	);
	expect(result).toBe("| Name | Purpose |\n| --- | --- |\n| **Acme** | Auth |");
});

test("escapes pipe characters in table cells", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "table",
						header: {
							type: "tableHeaderRow",
							cells: [{ type: "tableHeaderCell", children: [{ type: "text", value: "Field" }] }],
						},
						rows: [
							{
								type: "tableRow",
								cells: [{ type: "tableCell", children: [{ type: "text", value: "a|b" }] }],
							},
						],
					},
				],
			},
		]),
	);
	expect(result).toContain("| a\\|b |");
});

test("joins multiple content nodes within a section with blank lines", () => {
	const result = renderMarkdown(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{ type: "heading", value: "Title" },
					{
						type: "paragraph",
						children: [{ type: "text", value: "Body text." }],
					},
				],
			},
		]),
	);
	expect(result).toBe("## Title\n\nBody text.");
});
