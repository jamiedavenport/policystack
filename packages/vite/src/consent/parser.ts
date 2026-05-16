import { parseSync } from "oxc-parser";
import { extractScripts } from "./sfc";
import type { AnyNode, ImportInfo, Lang, ParsedComment, ParsedFile } from "./types";

const langByExt: Record<string, Lang> = {
	js: "js",
	mjs: "js",
	cjs: "js",
	jsx: "jsx",
	ts: "ts",
	mts: "ts",
	cts: "ts",
	tsx: "tsx",
};

export function langFor(file: string): Lang | null {
	const ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
	if (ext === "vue" || ext === "svelte") return "ts";
	return langByExt[ext] ?? null;
}

export function parseFile(file: string, source: string): ParsedFile | null {
	const ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
	if (ext === "vue" || ext === "svelte") {
		const blocks = extractScripts(source);
		if (blocks.length === 0) return null;
		const block = blocks[0]!;
		const lang = block.lang ?? "ts";
		return parsePlain(file, block.source, lang, block.startLine);
	}
	const lang = langFor(file);
	if (!lang) return null;
	return parsePlain(file, source, lang, 0);
}

function parsePlain(
	file: string,
	source: string,
	lang: Lang,
	lineOffset: number,
): ParsedFile | null {
	const result = parseSync(file, source, { lang });
	const comments: ParsedComment[] = result.comments.map((c) => ({
		type: c.type,
		value: c.value,
		line: lineFor(source, c.start) + lineOffset,
	}));
	const ast = result.program as unknown as AnyNode;
	return {
		file,
		source,
		lang,
		ast,
		comments,
		lineOffset,
		localBindings: collectTopLevelBindings(ast),
		imports: collectImports(ast),
		importSources: collectImportSources(ast),
	};
}

/**
 * Distinct, non-type `import … from "<source>"` specifier strings in program
 * order — the set the unified driver batch-resolves through the Vite SDK
 * resolver. Mirrors the legacy `analyse.ts` collector.
 */
function collectImportSources(program: AnyNode): string[] {
	const seen = new Set<string>();
	const body = program.body as AnyNode[] | undefined;
	if (!body) return [];
	for (const node of body) {
		if (node.type !== "ImportDeclaration") continue;
		if ((node.importKind as string | undefined) === "type") continue;
		const source = node.source as AnyNode | undefined;
		if (source && typeof source.value === "string") seen.add(source.value);
	}
	return [...seen];
}

function collectImports(program: AnyNode): Map<string, ImportInfo> {
	const out = new Map<string, ImportInfo>();
	const body = program.body as AnyNode[] | undefined;
	if (!body) return out;
	for (const node of body) {
		if (node.type !== "ImportDeclaration") continue;
		const src = node.source as AnyNode | undefined;
		if (src?.type !== "Literal" || typeof src.value !== "string") continue;
		const source = src.value;
		for (const spec of (node.specifiers as AnyNode[] | undefined) ?? []) {
			const local = spec.local as AnyNode | undefined;
			if (local?.type !== "Identifier") continue;
			let imported = "default";
			if (spec.type === "ImportSpecifier") {
				const imp = spec.imported as AnyNode | undefined;
				if (imp?.type === "Identifier") imported = imp.name as string;
				else if (imp?.type === "Literal" && typeof imp.value === "string") imported = imp.value;
			} else if (spec.type === "ImportNamespaceSpecifier") {
				imported = "*";
			}
			out.set(local.name as string, { source, imported });
		}
	}
	return out;
}

function collectTopLevelBindings(program: AnyNode): Set<string> {
	const out = new Set<string>();
	const body = program.body as AnyNode[] | undefined;
	if (!body) return out;
	for (const node of body) {
		if (node.type === "ImportDeclaration") {
			for (const spec of (node.specifiers as AnyNode[] | undefined) ?? []) {
				const local = spec.local as AnyNode | undefined;
				if (local?.type === "Identifier") out.add(local.name as string);
			}
		} else if (node.type === "VariableDeclaration") {
			for (const decl of (node.declarations as AnyNode[] | undefined) ?? []) {
				addPatternNames(decl.id as AnyNode | undefined, out);
			}
		} else if (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") {
			const id = node.id as AnyNode | undefined;
			if (id?.type === "Identifier") out.add(id.name as string);
		} else if (node.type === "ExportNamedDeclaration") {
			const decl = node.declaration as AnyNode | undefined;
			if (decl) collectFromDecl(decl, out);
		}
	}
	return out;
}

function collectFromDecl(decl: AnyNode, out: Set<string>): void {
	if (decl.type === "VariableDeclaration") {
		for (const d of (decl.declarations as AnyNode[] | undefined) ?? []) {
			addPatternNames(d.id as AnyNode | undefined, out);
		}
	} else if (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") {
		const id = decl.id as AnyNode | undefined;
		if (id?.type === "Identifier") out.add(id.name as string);
	}
}

function addPatternNames(node: AnyNode | undefined, out: Set<string>): void {
	if (!node) return;
	if (node.type === "Identifier") {
		out.add(node.name as string);
	} else if (node.type === "ObjectPattern") {
		for (const p of (node.properties as AnyNode[] | undefined) ?? []) {
			if (p.type === "Property") addPatternNames(p.value as AnyNode | undefined, out);
			else if (p.type === "RestElement") addPatternNames(p.argument as AnyNode | undefined, out);
		}
	} else if (node.type === "ArrayPattern") {
		for (const e of (node.elements as AnyNode[] | undefined) ?? []) {
			if (e) addPatternNames(e, out);
		}
	} else if (node.type === "AssignmentPattern") {
		addPatternNames(node.left as AnyNode | undefined, out);
	} else if (node.type === "RestElement") {
		addPatternNames(node.argument as AnyNode | undefined, out);
	}
}

export function lineFor(source: string, offset: number): number {
	let line = 1;
	for (let i = 0; i < offset && i < source.length; i++) {
		if (source.charCodeAt(i) === 10) line++;
	}
	return line;
}

export function positionFor(source: string, offset: number): { line: number; column: number } {
	let line = 1;
	let lastNl = -1;
	for (let i = 0; i < offset && i < source.length; i++) {
		if (source.charCodeAt(i) === 10) {
			line++;
			lastNl = i;
		}
	}
	return { line, column: offset - lastNl - 1 };
}
