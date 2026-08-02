import type { AnyNode, ImportInfo } from "./types";

const SET_PREFIX_RE = /^set[A-Z_]/;
const GATE_HELPER_NAMES = new Set(["acceptAll", "acceptNecessary"]);
const GATE_EXPORT = "ConsentGate";
const GATE_PACKAGE_PREFIX = "@policystack/";

type Imports = Map<string, ImportInfo> | undefined;

export function isGated(parents: AnyNode[], imports?: Imports): boolean {
	for (let i = parents.length - 1; i >= 0; i--) {
		const p = parents[i]!;
		if (isConsentGateElement(p, imports)) return true;
		if (isHasCheck(p)) return true;
		if (isGateHelperFunction(p)) return true;
	}
	return false;
}

/** A local binding that came from a PolicyStack package's `ConsentGate` export. */
function isGateBinding(local: string, imports: Imports): boolean {
	const info = imports?.get(local);
	return info?.imported === GATE_EXPORT && info.source.startsWith(GATE_PACKAGE_PREFIX);
}

/** A local binding for `import * as X from "@policystack/…"`. */
function isGateNamespaceBinding(local: string, imports: Imports): boolean {
	const info = imports?.get(local);
	return info?.imported === "*" && info.source.startsWith(GATE_PACKAGE_PREFIX);
}

function isConsentGateElement(node: AnyNode, imports: Imports): boolean {
	if (node.type !== "JSXElement") return false;
	const opening = node.openingElement as AnyNode | undefined;
	if (!opening) return false;
	const name = opening.name as AnyNode | undefined;
	if (!name) return false;

	// `<ConsentGate>` — matched by name alone, with no import required. Local
	// wrappers, barrel re-exports and auto-imports all rely on this, so import
	// resolution below only ever adds matches.
	if (name.type === "JSXIdentifier") {
		if (name.name === GATE_EXPORT) return true;
		// `import { ConsentGate as Gate }` → `<Gate>`.
		return isGateBinding(name.name as string, imports);
	}

	// `import * as PS` → `<PS.ConsentGate>`.
	if (name.type === "JSXMemberExpression") {
		const object = name.object as AnyNode | undefined;
		const property = name.property as AnyNode | undefined;
		if (object?.type !== "JSXIdentifier" || property?.type !== "JSXIdentifier") return false;
		if (property.name !== GATE_EXPORT) return false;
		return isGateNamespaceBinding(object.name as string, imports);
	}

	return false;
}

function isHasCheck(node: AnyNode): boolean {
	if (node.type !== "IfStatement" && node.type !== "ConditionalExpression") return false;
	const test = node.test as AnyNode | undefined;
	return Boolean(test && containsHasCall(test));
}

function containsHasCall(node: AnyNode): boolean {
	if (node.type === "CallExpression") {
		const callee = node.callee as AnyNode | undefined;
		if (
			callee &&
			(callee.type === "StaticMemberExpression" || callee.type === "MemberExpression")
		) {
			const prop = callee.property as AnyNode | undefined;
			if (prop?.type === "Identifier" && prop.name === "has") return true;
		}
	}
	for (const key in node) {
		if (key === "type" || key === "start" || key === "end") continue;
		const child = (node as Record<string, unknown>)[key];
		if (Array.isArray(child)) {
			for (const c of child) {
				if (c && typeof c === "object" && "type" in c && containsHasCall(c as AnyNode)) return true;
			}
		} else if (child && typeof child === "object" && "type" in child) {
			if (containsHasCall(child as AnyNode)) return true;
		}
	}
	return false;
}

function isGateHelperFunction(node: AnyNode): boolean {
	if (
		node.type !== "FunctionDeclaration" &&
		node.type !== "FunctionExpression" &&
		node.type !== "ArrowFunctionExpression"
	) {
		return false;
	}
	const id = node.id as AnyNode | undefined;
	if (id?.type !== "Identifier") return false;
	const name = id.name as string;
	if (GATE_HELPER_NAMES.has(name)) return true;
	return SET_PREFIX_RE.test(name);
}
