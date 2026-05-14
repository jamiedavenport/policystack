import { createT } from "../i18n";
import type { PolicyInput } from "../types";
import { compileCookieDocument } from "./cookie";
import { compilePrivacyDocument } from "./privacy";
import type { Document } from "./types";

export function compile(input: PolicyInput): Document {
	const t = createT(input.locale);
	if (input.type === "privacy") {
		const { type: _, ...config } = input;
		return {
			type: "document",
			policyType: "privacy",
			sections: compilePrivacyDocument(config, t),
		};
	}
	const { type: _, ...config } = input;
	return {
		type: "document",
		policyType: "cookie",
		sections: compileCookieDocument(config, t),
	};
}

export {
	bold,
	cell,
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
export type {
	BoldNode,
	ContentNode,
	Document,
	DocumentSection,
	HeadingNode,
	InlineNode,
	ItalicNode,
	LinkNode,
	ListItemNode,
	ListNode,
	Node,
	NodeContext,
	ParagraphNode,
	PolicyType,
	TableCellNode,
	TableNode,
	TableRowNode,
	TextNode,
} from "./types";
