import type { DocumentSection, HeadingNode, ListNode, ParagraphNode } from "@openpolicy/core";
import { defineComponent, h, type PropType } from "vue";

export const DefaultSection = defineComponent({
	name: "DefaultSection",
	props: {
		section: { type: Object as PropType<DocumentSection>, required: true },
	},
	setup(props, { slots }) {
		return () => {
			const reasonCode = props.section.context?.reason?.code;
			return h(
				"section",
				{
					"data-op-section": "",
					id: props.section.id,
					...(reasonCode ? { "data-op-reason": reasonCode } : {}),
				},
				slots.default?.(),
			);
		};
	},
});

export const DefaultHeading = defineComponent({
	name: "DefaultHeading",
	props: {
		node: { type: Object as PropType<HeadingNode>, required: true },
	},
	setup(props) {
		return () => {
			const level = props.node.level ?? 2;
			const tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
			return h(tag, { "data-op-heading": "" }, props.node.value);
		};
	},
});

export const DefaultParagraph = defineComponent({
	name: "DefaultParagraph",
	props: {
		node: { type: Object as PropType<ParagraphNode>, required: true },
	},
	setup(_props, { slots }) {
		return () => h("p", { "data-op-paragraph": "" }, slots.default?.());
	},
});

export const DefaultList = defineComponent({
	name: "DefaultList",
	props: {
		node: { type: Object as PropType<ListNode>, required: true },
	},
	setup(props, { slots }) {
		return () => {
			const tag = props.node.ordered ? "ol" : "ul";
			return h(tag, { "data-op-list": "" }, slots.default?.());
		};
	},
});
