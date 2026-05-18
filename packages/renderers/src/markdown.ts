import type { Document, InlineNode, ListNode, Visitor } from "@policystack/core";
import { visit } from "@policystack/core";

// One visitor map consumed by the shared core `visit()` — no hand-rolled walk.
// The `list` arm owns its whole subtree because ordered numbering and nested
// indent are positional and `visit()` threads no depth; nested lists recurse
// back through `v` and are re-indented by line-prefix (composable, so no depth
// param is needed). The `table` arm likewise owns its grid. `listItem` /
// `tableRow` / `tableHeaderRow` / `tableCell` / `tableHeaderCell` are therefore
// exhaustiveness-only no-ops (ADR 0001 unifying principle).
const mdVisitor: Visitor<string> = {
	document: (node, v) => node.sections.map(v).join("\n\n---\n\n"),
	section: (node, v) => node.content.map(v).join("\n\n"),
	heading: (node) => `${"#".repeat(node.level ?? 2)} ${node.value}`,
	paragraph: (node, v) => node.children.map(v).join(""),
	list: (node, v) =>
		node.items
			.map((item, index) => {
				const parts: string[] = [];
				let nested: ListNode | null = null;
				for (const child of item.children) {
					if (child.type === "list") nested = child;
					else parts.push(v(child));
				}
				const bullet = node.ordered ? `${index + 1}.` : "-";
				const line = `${bullet} ${parts.join("")}`;
				if (!nested) return line;
				const sub = v(nested)
					.split("\n")
					.map((l) => `  ${l}`)
					.join("\n");
				return `${line}\n${sub}`;
			})
			.join("\n"),
	table: (node, v) => {
		const cellText = (cell: { children: InlineNode[] }) =>
			cell.children.map(v).join("").replace(/\|/g, "\\|").replace(/\n/g, " ");
		const headerLine = `| ${node.header.cells.map(cellText).join(" | ")} |`;
		const separatorLine = `| ${node.header.cells.map(() => "---").join(" | ")} |`;
		const bodyLines = node.rows.map((r) => `| ${r.cells.map(cellText).join(" | ")} |`);
		return [headerLine, separatorLine, ...bodyLines].join("\n");
	},
	text: (node) => node.value,
	bold: (node) => `**${node.value}**`,
	italic: (node) => `_${node.value}_`,
	link: (node) => `[${node.value}](${node.href})`,
	// Owned by the `list` / `table` arms — present only for exhaustiveness.
	listItem: () => "",
	tableHeaderRow: () => "",
	tableRow: () => "",
	tableHeaderCell: () => "",
	tableCell: () => "",
	// forward-compat: unrecognized node renders as nothing (ADR 0001)
	unknown: () => "",
};

export function renderMarkdown(doc: Document): string {
	return visit(doc, mdVisitor);
}
