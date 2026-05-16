import type { Document, InlineNode, ListItemNode, ListNode, TableNode } from "@openpolicy/core";

function renderInline(node: InlineNode): string {
	switch (node.type) {
		case "text":
			return node.value;
		case "bold":
			return `**${node.value}**`;
		case "italic":
			return `_${node.value}_`;
		case "link":
			return `[${node.value}](${node.href})`;
	}
}

function renderListItem(item: ListItemNode, indent = "", ordered = false, index = 0): string {
	const parts: string[] = [];
	let nestedList: ListNode | null = null;
	for (const child of item.children) {
		if (child.type === "list") {
			nestedList = child;
		} else {
			parts.push(renderInline(child));
		}
	}
	const bullet = ordered ? `${index + 1}.` : "-";
	const line = `${indent}${bullet} ${parts.join("")}`;
	if (nestedList) {
		const nested = nestedList.items
			.map((i, idx) => renderListItem(i, `${indent}  `, nestedList!.ordered, idx))
			.join("\n");
		return `${line}\n${nested}`;
	}
	return line;
}

function renderCellInline(children: InlineNode[]): string {
	return children.map(renderInline).join("").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderRowCells(cells: { children: InlineNode[] }[]): string {
	return `| ${cells.map((c) => renderCellInline(c.children)).join(" | ")} |`;
}

function renderTable(node: TableNode): string {
	const headerLine = renderRowCells(node.header.cells);
	const separatorLine = `| ${node.header.cells.map(() => "---").join(" | ")} |`;
	const bodyLines = node.rows.map((r) => renderRowCells(r.cells));
	return [headerLine, separatorLine, ...bodyLines].join("\n");
}

export function renderMarkdown(doc: Document): string {
	return doc.sections
		.map((section) => {
			// biome-ignore lint/suspicious/useIterableCallbackReturn: typed
			const blocks = section.content.map((node) => {
				switch (node.type) {
					case "heading": {
						const hashes = "#".repeat(node.level ?? 2);
						return `${hashes} ${node.value}`;
					}
					case "paragraph":
						return node.children.map(renderInline).join("");
					case "list":
						return node.items
							.map((item, idx) => renderListItem(item, "", node.ordered, idx))
							.join("\n");
					case "table":
						return renderTable(node);
					case "unknown":
						// forward-compat: unrecognized node renders as nothing (ADR 0001)
						return "";
				}
			});
			return blocks.join("\n\n");
		})
		.join("\n\n---\n\n");
}
