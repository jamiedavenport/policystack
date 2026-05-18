import type { Document } from "@policystack/core";
import type { VNodeChild } from "vue";
import type { PolicyComponents } from "../types";
import { renderNode } from "./renderNode";

export function renderDocument(doc: Document, components: PolicyComponents = {}): VNodeChild {
	return renderNode(doc, components);
}
