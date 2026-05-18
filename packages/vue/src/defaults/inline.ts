import type { BoldNode, ItalicNode, LinkNode, TextNode } from "@policystack/core";
import { defineComponent, h, type PropType } from "vue";

export const DefaultText = defineComponent({
	name: "DefaultText",
	props: {
		node: { type: Object as PropType<TextNode>, required: true },
	},
	setup(props) {
		return () => props.node.value;
	},
});

export const DefaultBold = defineComponent({
	name: "DefaultBold",
	props: {
		node: { type: Object as PropType<BoldNode>, required: true },
	},
	setup(props) {
		return () => h("strong", null, props.node.value);
	},
});

export const DefaultItalic = defineComponent({
	name: "DefaultItalic",
	props: {
		node: { type: Object as PropType<ItalicNode>, required: true },
	},
	setup(props) {
		return () => h("em", null, props.node.value);
	},
});

export const DefaultLink = defineComponent({
	name: "DefaultLink",
	props: {
		node: { type: Object as PropType<LinkNode>, required: true },
	},
	setup(props) {
		return () => h("a", { href: props.node.href }, props.node.value);
	},
});
