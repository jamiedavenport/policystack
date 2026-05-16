import type { TableCellNode, TableHeaderCellNode, TableNode, TableRowNode } from "@openpolicy/core";
import { h, type VNodeChild } from "vue";
import {
	DefaultTable,
	DefaultTableBody,
	DefaultTableCell,
	DefaultTableHead,
	DefaultTableHeader,
	DefaultTableHeaderRow,
	DefaultTableRow,
} from "../defaults/table";
import type { PolicyComponents } from "../types";
import type { RenderNode } from "./renderNode";

export function renderTable(
	node: TableNode,
	components: PolicyComponents,
	renderNode: RenderNode,
	key?: number,
): VNodeChild {
	const TableComp = components.Table ?? DefaultTable;
	const TableHeaderComp = components.TableHeader ?? DefaultTableHeader;
	const TableBodyComp = components.TableBody ?? DefaultTableBody;
	const TableRowComp = components.TableRow ?? DefaultTableRow;
	const TableHeaderRowComp = components.TableHeaderRow ?? DefaultTableHeaderRow;
	const TableHeadComp = components.TableHead ?? DefaultTableHead;
	const TableCellComp = components.TableCell ?? DefaultTableCell;

	const renderHeaderCell = (cell: TableHeaderCellNode, cellKey: number) => {
		const cellChildren = cell.children.map((n, i) => renderNode(n, components, i));
		return h(TableHeadComp, { key: cellKey, node: cell }, { default: () => cellChildren });
	};

	const renderBodyCell = (cell: TableCellNode, cellKey: number) => {
		const cellChildren = cell.children.map((n, i) => renderNode(n, components, i));
		return h(TableCellComp, { key: cellKey, node: cell }, { default: () => cellChildren });
	};

	const renderBodyRow = (row: TableRowNode, rowKey: number) => {
		const rowChildren = row.cells.map((c, ci) => renderBodyCell(c, ci));
		return h(TableRowComp, { key: rowKey, node: row }, { default: () => rowChildren });
	};

	const headerCells = node.header.cells.map((c, ci) => renderHeaderCell(c, ci));
	const headerRow = h(TableHeaderRowComp, { node: node.header }, { default: () => headerCells });
	const bodyRows = node.rows.map((row, ri) => renderBodyRow(row, ri));
	const inner = [
		h(TableHeaderComp, null, { default: () => headerRow }),
		h(TableBodyComp, null, { default: () => bodyRows }),
	];
	return h(TableComp, { key, node }, { default: () => inner });
}
