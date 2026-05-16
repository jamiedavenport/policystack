import type { Node } from "@openpolicy/core";
import type { VNodeChild } from "vue";
import type { PolicyComponents } from "../types";
import {
	renderHeading,
	renderList,
	renderListItem,
	renderParagraph,
	renderSection,
} from "./renderBlock";
import { renderBold, renderItalic, renderLink, renderText } from "./renderInline";
import { renderTable } from "./renderTable";

export type RenderNode = (node: Node, components: PolicyComponents, key?: number) => VNodeChild;

export const renderNode: RenderNode = (node, components, key) => {
	switch (node.type) {
		case "document":
			return node.sections.map((section, i) => renderSection(section, components, renderNode, i));
		case "section":
			return renderSection(node, components, renderNode, key);
		case "heading":
			return renderHeading(node, components, key);
		case "paragraph":
			return renderParagraph(node, components, renderNode, key);
		case "list":
			return renderList(node, components, renderNode, key);
		case "listItem":
			return renderListItem(node, components, renderNode, key);
		case "table":
			return renderTable(node, components, renderNode, key);
		case "tableRow":
		case "tableCell":
		case "tableHeaderRow":
		case "tableHeaderCell":
			return null;
		// Forward-compat no-op: unrecognized future block nodes render as
		// nothing rather than crashing the renderer (see ADR 0001).
		case "unknown":
			return null;
		case "text":
			return renderText(node, components, key);
		case "bold":
			return renderBold(node, components, key);
		case "italic":
			return renderItalic(node, components, key);
		case "link":
			return renderLink(node, components, key);
	}
};
