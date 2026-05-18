import type { Document, Visitor } from "@policystack/core";
import { visit } from "@policystack/core";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// One visitor map consumed by the shared core `visit()` — no hand-rolled walk.
// Every arm does real work except the forward-compat `unknown` no-op (ADR 0001);
// HTML nests structurally, so list/table children recurse through `v` rather
// than being owned by a parent arm.
const htmlVisitor: Visitor<string> = {
	document: (node, v) => node.sections.map(v).join("\n"),
	section: (node, v) => node.content.map(v).join("\n"),
	heading: (node) => {
		const level = node.level ?? 2;
		return `<h${level}>${escapeHtml(node.value)}</h${level}>`;
	},
	paragraph: (node, v) => `<p>${node.children.map(v).join("")}</p>`,
	list: (node, v) => {
		const tag = node.ordered ? "ol" : "ul";
		return `<${tag}>${node.items.map(v).join("")}</${tag}>`;
	},
	listItem: (node, v) => `<li>${node.children.map(v).join("")}</li>`,
	table: (node, v) =>
		`<table><thead>${v(node.header)}</thead><tbody>${node.rows.map(v).join("")}</tbody></table>`,
	tableHeaderRow: (node, v) => `<tr>${node.cells.map(v).join("")}</tr>`,
	tableRow: (node, v) => `<tr>${node.cells.map(v).join("")}</tr>`,
	tableHeaderCell: (node, v) => `<th>${node.children.map(v).join("")}</th>`,
	tableCell: (node, v) => `<td>${node.children.map(v).join("")}</td>`,
	text: (node) => escapeHtml(node.value),
	bold: (node) => `<strong>${escapeHtml(node.value)}</strong>`,
	italic: (node) => `<em>${escapeHtml(node.value)}</em>`,
	link: (node) => `<a href="${escapeHtml(node.href)}">${escapeHtml(node.value)}</a>`,
	// forward-compat: unrecognized node renders as nothing (ADR 0001)
	unknown: () => "",
};

export function renderHTML(doc: Document): string {
	return visit(doc, htmlVisitor);
}
