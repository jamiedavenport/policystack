import type {
	TableCellNode,
	TableHeaderCellNode,
	TableHeaderRowNode,
	TableNode,
	TableRowNode,
} from "@openpolicy/core";
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

export const DefaultTableHeader = defineComponent({
	name: "DefaultTableHeader",
	setup(_, { slots }) {
		return () => h("thead", { "data-op-table-header": "" }, slots.default?.());
	},
});

export const DefaultTableBody = defineComponent({
	name: "DefaultTableBody",
	setup(_, { slots }) {
		return () => h("tbody", { "data-op-table-body": "" }, slots.default?.());
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

export const DefaultTableHeaderRow = defineComponent({
	name: "DefaultTableHeaderRow",
	props: {
		node: { type: Object as PropType<TableHeaderRowNode>, required: true },
	},
	setup(_props, { slots }) {
		return () => h("tr", { "data-op-table-row": "" }, slots.default?.());
	},
});

export const DefaultTableHead = defineComponent({
	name: "DefaultTableHead",
	props: {
		node: { type: Object as PropType<TableHeaderCellNode>, required: true },
	},
	setup(_props, { slots }) {
		return () => h("th", { "data-op-table-cell": "", scope: "col" }, slots.default?.());
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
