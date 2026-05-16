import { createT } from "../i18n";
import type { PolicyInput } from "../types";
import { compileCookieDocument } from "./cookie";
import { compilePrivacyDocument } from "./privacy";
import { AST_VERSION, type Document } from "./types";

export function compile(input: PolicyInput): Document {
	const t = createT(input.locale);
	if (input.type === "privacy") {
		const { type: _, ...config } = input;
		return {
			type: "document",
			astVersion: AST_VERSION,
			policyType: "privacy",
			sections: compilePrivacyDocument(config, t),
		};
	}
	const { type: _, ...config } = input;
	return {
		type: "document",
		astVersion: AST_VERSION,
		policyType: "cookie",
		sections: compileCookieDocument(config, t),
	};
}

export {
	bold,
	cell,
	headerCell,
	headerRow,
	heading,
	italic,
	li,
	link,
	ol,
	p,
	row,
	section,
	table,
	text,
	ul,
} from "./helpers";
export { AST_VERSION } from "./types";
export type {
	BoldNode,
	ComplianceReason,
	ContentNode,
	Document,
	DocumentSection,
	HeadingNode,
	InlineNode,
	IssueCode,
	ItalicNode,
	LinkNode,
	ListItemNode,
	ListNode,
	Node,
	NodeContext,
	ParagraphNode,
	PolicyType,
	TableCellNode,
	TableHeaderCellNode,
	TableHeaderRowNode,
	TableNode,
	TableRowNode,
	TextNode,
	UnknownNode,
} from "./types";
export { visit } from "./visit";
export type { Visitor } from "./visit";
