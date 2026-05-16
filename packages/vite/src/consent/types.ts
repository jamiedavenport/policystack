export type CookieKind =
	| "document.cookie"
	| "js-cookie"
	| "cookies-next"
	| "react-cookie"
	| "next-headers"
	| "set-cookie-header";

export type Cookie = {
	file: string;
	line: number;
	column: number;
	kind: CookieKind;
	name?: string;
	vendor?: string;
};

export type VendorVia = "import" | "global" | "script-url";

/**
 * Which detector identified a vendor (PS-25). `via` is the AST mechanism;
 * `detector` is the user-facing label surfaced in diagnostics and the
 * declared-vs-used cross-check — `"package.json"` for the opt-in dependency
 * scan, `"import"` / `"global"` for the single AST walk.
 */
export type VendorDetector = "package.json" | "import" | "global";

export type VendorHit = {
	file: string;
	line: number;
	column: number;
	vendor: string;
	category: string;
	via: VendorVia;
	detector: VendorDetector;
};

export type Hit = Cookie | VendorHit;

export type Ungated = {
	file: string;
	line: number;
	reason: "cookie-outside-gate" | "vendor-outside-gate";
	hit: Hit;
};

export type ScanResult = {
	cookies: Cookie[];
	vendors: VendorHit[];
	ungated: Ungated[];
};

export type VendorEntry = {
	vendor: string;
	category: string;
	imports?: string[];
	globals?: string[];
	scriptUrls?: string[];
};

export type VendorRegistry = VendorEntry[];

export type Lang = "js" | "jsx" | "ts" | "tsx";

export type ImportInfo = {
	source: string;
	imported: string;
};

export type ParsedFile = {
	file: string;
	source: string;
	lang: Lang;
	ast: AnyNode;
	comments: ParsedComment[];
	lineOffset: number;
	localBindings: Set<string>;
	imports: Map<string, ImportInfo>;
	/**
	 * De-duplicated non-type `import … from "<source>"` specifiers, in program
	 * order. The unified driver (PS-25) resolves these through the Vite SDK
	 * resolver once, in batch, before extraction — same role as the legacy
	 * `ParsedModule.importSources`.
	 */
	importSources: string[];
};

export type ParsedComment = {
	type: "Line" | "Block";
	value: string;
	line: number;
};

export type AnyNode = {
	type: string;
	start: number;
	end: number;
	[key: string]: unknown;
};

export type VisitContext = {
	file: string;
	source: string;
	node: AnyNode;
	parents: AnyNode[];
	lineOffset: number;
	registry: VendorRegistry;
	localBindings: Set<string>;
	imports: Map<string, ImportInfo>;
	report: (hit: Hit) => void;
	position: (offset: number) => { line: number; column: number };
};

export type Rule = {
	name: string;
	visit: (ctx: VisitContext) => void;
};

export type ScanOptions = {
	cwd: string;
	include?: string[];
	exclude?: string[];
	rules?: Rule[];
	vendors?: VendorRegistry;
	concurrency?: number;
};
