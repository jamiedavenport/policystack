import type { AnyNode, Rule, VendorEntry } from "../types";

export const vendorImportsRule: Rule = {
	name: "vendor-imports",
	visit: (ctx) => {
		const node = ctx.node;
		if (node.type === "ImportDeclaration") {
			const src = node.source as AnyNode | undefined;
			if (src?.type !== "Literal" || typeof src.value !== "string") return;
			const entry = matchImport(ctx.registry, src.value);
			if (!entry) return;
			const pos = ctx.position(node.start);
			ctx.report({
				file: ctx.file,
				line: pos.line,
				column: pos.column,
				vendor: entry.vendor,
				category: entry.category,
				via: "import",
				detector: "import",
			});
			return;
		}
		if (node.type === "ImportExpression") {
			const src = node.source as AnyNode | undefined;
			if (src?.type === "Literal" && typeof src.value === "string") {
				const entry = matchImport(ctx.registry, src.value);
				if (entry) {
					const pos = ctx.position(node.start);
					ctx.report({
						file: ctx.file,
						line: pos.line,
						column: pos.column,
						vendor: entry.vendor,
						category: entry.category,
						via: "import",
						detector: "import",
					});
				}
			}
			return;
		}
		if (node.type === "CallExpression") {
			const callee = node.callee as AnyNode | undefined;
			const ident = identifierFor(callee);
			if (ident) {
				const name = ident.name as string;
				if (ctx.localBindings.has(name)) return;
				const entry = matchGlobal(ctx.registry, name);
				if (entry) {
					const pos = ctx.position(ident.start);
					ctx.report({
						file: ctx.file,
						line: pos.line,
						column: pos.column,
						vendor: entry.vendor,
						category: entry.category,
						via: "global",
						detector: "global",
					});
				}
			}
		}
	},
};

function matchImport(registry: VendorEntry[], specifier: string): VendorEntry | undefined {
	for (const entry of registry) {
		if (!entry.imports) continue;
		if (entry.imports.includes(specifier)) return entry;
		for (const prefix of entry.imports) {
			if (specifier === prefix || specifier.startsWith(`${prefix}/`)) return entry;
		}
	}
	return undefined;
}

function identifierFor(callee: AnyNode | undefined): AnyNode | undefined {
	if (!callee) return undefined;
	if (callee.type === "Identifier") return callee;
	if (callee.type === "StaticMemberExpression" || callee.type === "MemberExpression") {
		const obj = callee.object as AnyNode | undefined;
		if (obj?.type === "Identifier") return obj;
	}
	return undefined;
}

function matchGlobal(registry: VendorEntry[], name: string): VendorEntry | undefined {
	for (const entry of registry) {
		if (entry.globals?.includes(name)) return entry;
	}
	return undefined;
}
