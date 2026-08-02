import type {
	AnyNode,
	Hit,
	ParsedFile,
	Rule,
	Ungated,
	VendorRegistry,
	VisitContext,
} from "./types";
import { isGated } from "./ungated";

const skipKeys = new Set(["loc", "range", "type", "start", "end"]);

export type WalkResult = {
	hits: Hit[];
	ungated: Ungated[];
};

export function walk(parsed: ParsedFile, rules: Rule[], registry: VendorRegistry): WalkResult {
	const hits: Hit[] = [];
	const ungated: Ungated[] = [];
	const parents: AnyNode[] = [];

	const ctxBase = {
		file: parsed.file,
		source: parsed.source,
		lineOffset: parsed.lineOffset,
		registry,
		localBindings: parsed.localBindings,
		imports: parsed.imports,
		position: (offset: number) => positionFor(parsed.source, offset, parsed.lineOffset),
	};

	function visit(node: AnyNode | null | undefined): void {
		if (!node || typeof node !== "object" || typeof node.type !== "string") return;
		const ctx: VisitContext = {
			...ctxBase,
			node,
			parents,
			report: (hit: Hit) => {
				hits.push(hit);
				if (!isGated(parents, ctxBase.imports)) {
					ungated.push({
						file: hit.file,
						line: hit.line,
						reason: "kind" in hit ? "cookie-outside-gate" : "vendor-outside-gate",
						hit,
					});
				}
			},
		};
		for (const rule of rules) rule.visit(ctx);
		parents.push(node);
		for (const key in node) {
			if (skipKeys.has(key)) continue;
			const child = node[key];
			if (Array.isArray(child)) {
				for (const c of child) visit(c as AnyNode);
			} else if (child && typeof child === "object" && "type" in child) {
				visit(child as AnyNode);
			}
		}
		parents.pop();
	}

	visit(parsed.ast);
	return { hits, ungated };
}

function positionFor(
	source: string,
	offset: number,
	lineOffset: number,
): { line: number; column: number } {
	let line = 1;
	let lastNl = -1;
	for (let i = 0; i < offset && i < source.length; i++) {
		if (source.charCodeAt(i) === 10) {
			line++;
			lastNl = i;
		}
	}
	return { line: line + lineOffset, column: offset - lastNl - 1 };
}

export function isCallTo(node: AnyNode, name: string): boolean {
	if (node.type !== "CallExpression") return false;
	return calleeMatches(node.callee as AnyNode | undefined, name);
}

export function calleeMatches(callee: AnyNode | null | undefined, name: string): boolean {
	if (!callee) return false;
	const parts = name.split(".");
	if (parts.length === 1) {
		return callee.type === "Identifier" && callee.name === parts[0];
	}
	if (callee.type !== "StaticMemberExpression" && callee.type !== "MemberExpression") return false;
	const prop = callee.property as AnyNode | undefined;
	if (!prop || prop.type !== "Identifier" || prop.name !== parts[parts.length - 1]) return false;
	return calleeMatches(callee.object as AnyNode | undefined, parts.slice(0, -1).join("."));
}

export function getStringArg(node: AnyNode, index: number): string | undefined {
	const args = node.arguments as AnyNode[] | undefined;
	if (!args || !args[index]) return undefined;
	const arg = args[index];
	if (arg.type === "Literal" && typeof arg.value === "string") return arg.value;
	if (arg.type === "TemplateLiteral") {
		const quasis = arg.quasis as AnyNode[] | undefined;
		const exprs = arg.expressions as AnyNode[] | undefined;
		if (quasis && quasis.length === 1 && (!exprs || exprs.length === 0)) {
			const cooked = (quasis[0] as { value?: { cooked?: string } } | undefined)?.value?.cooked;
			if (typeof cooked === "string") return cooked;
		}
	}
	return undefined;
}
