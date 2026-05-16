import { expect, test } from "vite-plus/test";
import { AST_VERSION, type Document } from "@openpolicy/core";
import { renderHTML } from "./html";

function doc(sections: Document["sections"]): Document {
	return { type: "document", astVersion: AST_VERSION, policyType: "privacy", sections };
}

test("renders heading as <h2>", () => {
	const result = renderHTML(
		doc([
			{
				type: "section",
				id: "s1",
				content: [{ type: "heading", value: "Introduction" }],
			},
		]),
	);
	expect(result).toContain("<h2>Introduction</h2>");
});

test("renders paragraph as <p>", () => {
	const result = renderHTML(
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
	expect(result).toContain("<p>Hello world</p>");
});

test("renders bold as <strong>", () => {
	const result = renderHTML(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "paragraph",
						children: [{ type: "bold", value: "Important" }],
					},
				],
			},
		]),
	);
	expect(result).toContain("<strong>Important</strong>");
});

test("renders link as <a>", () => {
	const result = renderHTML(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{
						type: "paragraph",
						children: [{ type: "link", href: "https://example.com", value: "here" }],
					},
				],
			},
		]),
	);
	expect(result).toContain('<a href="https://example.com">here</a>');
});

test("renders heading with level 3 as <h3>", () => {
	const result = renderHTML(
		doc([
			{
				type: "section",
				id: "s1",
				content: [{ type: "heading", level: 3, value: "Sub-section" }],
			},
		]),
	);
	expect(result).toContain("<h3>Sub-section</h3>");
});

test("renders ordered list as <ol>/<li>", () => {
	const result = renderHTML(
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
	expect(result).toContain("<ol>");
	expect(result).toContain("<li>First</li>");
	expect(result).toContain("<li>Second</li>");
});

test("renders italic as <em>", () => {
	const result = renderHTML(
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
	expect(result).toContain("<em>emphasis</em>");
});

test("renders a table with thead/tbody/th/td", () => {
	const result = renderHTML(
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
	expect(result).toContain("<table>");
	expect(result).toContain("<thead><tr><th>Name</th><th>Purpose</th></tr></thead>");
	expect(result).toContain("<tbody><tr><td><strong>Acme</strong></td><td>Auth</td></tr></tbody>");
});

test("renders list as <ul>/<li>", () => {
	const result = renderHTML(
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
	expect(result).toContain("<ul>");
	expect(result).toContain("<li>Alpha</li>");
	expect(result).toContain("<li>Beta</li>");
});

test("forward-compat: an unknown node renders as a no-op", () => {
	const result = renderHTML(
		doc([
			{
				type: "section",
				id: "s1",
				content: [
					{ type: "heading", value: "Before" },
					{ type: "unknown", raw: { type: "future-node", value: "ignored" } },
					{ type: "heading", value: "After" },
				],
			},
		]),
	);
	expect(result).toContain("<h2>Before</h2>");
	expect(result).toContain("<h2>After</h2>");
	expect(result).not.toContain("ignored");
});
