import type { Document, InlineNode, ListItemNode, ListNode, TableNode } from "@openpolicy/core";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function renderInline(node: InlineNode): string {
	switch (node.type) {
		case "text":
			return escapeHtml(node.value);
		case "bold":
			return `<strong>${escapeHtml(node.value)}</strong>`;
		case "italic":
			return `<em>${escapeHtml(node.value)}</em>`;
		case "link":
			return `<a href="${escapeHtml(node.href)}">${escapeHtml(node.value)}</a>`;
	}
}

function renderListItem(item: ListItemNode): string {
	const content = item.children
		.map((child) => (child.type === "list" ? renderList(child) : renderInline(child as InlineNode)))
		.join("");
	return `<li>${content}</li>`;
}

function renderList(node: ListNode): string {
	const tag = node.ordered ? "ol" : "ul";
	const items = node.items.map(renderListItem).join("");
	return `<${tag}>${items}</${tag}>`;
}

function renderRowCells(cells: { children: InlineNode[] }[], tag: "th" | "td"): string {
	return cells.map((c) => `<${tag}>${c.children.map(renderInline).join("")}</${tag}>`).join("");
}

function renderTable(node: TableNode): string {
	const head = `<thead><tr>${renderRowCells(node.header.cells, "th")}</tr></thead>`;
	const body = `<tbody>${node.rows
		.map((r) => `<tr>${renderRowCells(r.cells, "td")}</tr>`)
		.join("")}</tbody>`;
	return `<table>${head}${body}</table>`;
}

export function renderHTML(doc: Document): string {
	return doc.sections
		.map((section) => {
			// biome-ignore lint/suspicious/useIterableCallbackReturn: typed
			const blocks = section.content.map((node) => {
				switch (node.type) {
					case "heading": {
						const level = node.level ?? 2;
						return `<h${level}>${escapeHtml(node.value)}</h${level}>`;
					}
					case "paragraph":
						return `<p>${node.children.map(renderInline).join("")}</p>`;
					case "list":
						return renderList(node);
					case "table":
						return renderTable(node);
					case "unknown":
						// forward-compat: unrecognized node renders as nothing (ADR 0001)
						return "";
				}
			});
			return blocks.join("\n");
		})
		.join("\n");
}
