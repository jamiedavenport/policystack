import type { Document } from "@policystack/core";
import type { ReactNode } from "react";
import { renderNode } from "./components/defaults";
import type { PolicyComponents } from "./types";

export function renderDocument(doc: Document, components: PolicyComponents = {}): ReactNode {
	return renderNode(doc, components);
}
