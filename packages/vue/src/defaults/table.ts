import type {
	TableCellNode,
	TableHeaderCellNode,
	TableHeaderRowNode,
	TableNode,
	TableRowNode,
} from "@policystack/core";
import { defineComponent, h, type PropType } from "vue";

export const DefaultTable = defineComponent({
	name: "DefaultTable",
	props: {
		node: { type: Object as PropType<TableNode>, required: true },
	},
	setup(_props, { slots }) {
		return () => h("table", { "data-op-table": "" }, slots.default?.());
	},
});

// `<thead>` is a rendering detail owned by the default header-row component,
// not a node/slot of its own — there is exactly one header row per table.
export const DefaultTableHeaderRow = defineComponent({
	name: "DefaultTableHeaderRow",
	props: {
		node: { type: Object as PropType<TableHeaderRowNode>, required: true },
	},
	setup(_props, { slots }) {
		return () =>
			h(
				"thead",
				{ "data-op-table-header": "" },
				h("tr", { "data-op-table-row": "" }, slots.default?.()),
			);
	},
});

export const DefaultTableHeaderCell = defineComponent({
	name: "DefaultTableHeaderCell",
	props: {
		node: { type: Object as PropType<TableHeaderCellNode>, required: true },
	},
	setup(_props, { slots }) {
		return () => h("th", { "data-op-table-cell": "", scope: "col" }, slots.default?.());
	},
});

export const DefaultTableRow = defineComponent({
	name: "DefaultTableRow",
	props: {
		node: { type: Object as PropType<TableRowNode>, required: true },
	},
	setup(_props, { slots }) {
		return () => h("tr", { "data-op-table-row": "" }, slots.default?.());
	},
});

export const DefaultTableCell = defineComponent({
	name: "DefaultTableCell",
	props: {
		node: { type: Object as PropType<TableCellNode>, required: true },
	},
	setup(_props, { slots }) {
		return () => h("td", { "data-op-table-cell": "" }, slots.default?.());
	},
});
