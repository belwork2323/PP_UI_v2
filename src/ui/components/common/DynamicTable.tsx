import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { SchemaTableBlock, SchemaTableColumn, SchemaTableColumnSlot } from "../../../schema-engine/types";
import { applyFormulaColumns } from "../../../schema-engine/rules/formulaEval";
import { flattenTableColumns, isColumnGroup } from "../../../schema-engine/utils/schemaUtils";
import type { SchemaApiContext } from "../../../schema-engine/rules/apiDependency";
import type { SchemaThemeTokens } from "../../../schema-engine/utils/schemaUtils";
import {
  isPresetLockedCell,
  isPresetLockedRow,
} from "../../../schema-engine/utils/tableRowUtils";
import SchemaApiDropdown from "./SchemaApiDropdown";
import { DateField, DateTimeField, TimeField } from "./DateField";
import FormulaCell from "./FormulaCell";
import FileUploadButton from "./FileUploadButton";

type DynamicTableProps = {
  config: SchemaTableBlock;
  rows: Record<string, unknown>[];
  onChange: (rows: Record<string, unknown>[]) => void;
  readOnly?: boolean;
  theme?: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const isFormulaCol = (col: SchemaTableColumn) =>
  col.fieldType === "formula" || Boolean(col.formula?.expression);

const isReadonlyCol = (col: SchemaTableColumn) =>
  col.readonly || col.fieldType === "static" || col.fieldType === "serial" || isFormulaCol(col);

const cellSx = (col: SchemaTableColumn) => ({
  ...(col.ui?.width ? { width: col.ui.width } : {}),
  whiteSpace: "normal" as const,
  wordBreak: "break-word" as const,
  verticalAlign: "top" as const,
  minWidth: col.fieldType === "serial" ? 48 : col.fieldType === "datetime" ? 180 : 100,
});

const renderFlatHeaderCells = (columns: SchemaTableColumnSlot[]) =>
  columns.flatMap((slot) => {
    if (isColumnGroup(slot)) {
      return slot.columns.map((col) => (
        <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: "0.72rem", ...cellSx(col) }}>
          {col.label}
          {col.unit ? ` (${col.unit})` : ""}
        </TableCell>
      ));
    }
    return (
      <TableCell key={slot.id} sx={{ fontWeight: 700, fontSize: "0.72rem", ...cellSx(slot) }}>
        {slot.label}
        {slot.unit ? ` (${slot.unit})` : ""}
      </TableCell>
    );
  });

const renderGroupedSubHeaderCells = (columns: SchemaTableColumnSlot[]) =>
  columns.flatMap((slot) => {
    if (!isColumnGroup(slot)) return [];
    return slot.columns.map((col) => (
      <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: "0.72rem", ...cellSx(col) }}>
        {col.label}
        {col.unit ? ` (${col.unit})` : ""}
      </TableCell>
    ));
  });

const renderGroupHeaderRow = (columns: SchemaTableColumnSlot[], allowDelete: boolean) => (
  <TableRow sx={{ background: "rgba(21,101,192,0.06)" }}>
    {columns.map((slot) => {
      if (isColumnGroup(slot)) {
        return (
          <TableCell
            key={slot.id}
            colSpan={slot.columns.length}
            align="center"
            sx={{ fontWeight: 700, fontSize: "0.72rem" }}
          >
            {slot.label}
          </TableCell>
        );
      }
      return (
        <TableCell key={slot.id} rowSpan={2} sx={{ fontWeight: 700, fontSize: "0.72rem", ...cellSx(slot) }}>
          {slot.label}
          {slot.unit ? ` (${slot.unit})` : ""}
        </TableCell>
      );
    })}
    {allowDelete ? (
      <TableCell rowSpan={2} sx={{ width: 48, fontWeight: 700, fontSize: "0.72rem" }}>
        Actions
      </TableCell>
    ) : null}
  </TableRow>
);


const renderCellEditor = (
  col: SchemaTableColumn,
  value: string,
  onChange: (next: string) => void,
  readOnly: boolean,
  apiContext?: SchemaApiContext,
) => {
  if (isReadonlyCol(col) || readOnly) {
    return <FormulaCell value={value} unit={col.unit} />;
  }

  switch (col.fieldType) {
    case "dropdown":
      return (
        <SchemaApiDropdown
          value={value}
          onChange={onChange}
          dataSource={col.dataSource}
          apiContext={apiContext}
          disabled={readOnly}
        />
      );
    case "date":
      return <DateField value={value} onChange={onChange} disabled={readOnly} />;
    case "time":
      return <TimeField value={value} onChange={onChange} disabled={readOnly} />;
    case "datetime":
      return <DateTimeField value={value} onChange={onChange} disabled={readOnly} />;
    case "textarea":
      return (
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          inputProps={{ style: { fontSize: "0.78rem" } }}
          sx={{ minWidth: 140 }}
        />
      );
    case "file":
      return (
        <FileUploadButton
          label={value || "Choose File"}
          icon={undefined}
          accept={undefined}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
        />
      );
    case "number":
    case "decimal":
      return (
        <TextField
          size="small"
          fullWidth
          type="number"
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          inputProps={{ style: { fontSize: "0.78rem" } }}
          sx={{ minWidth: 80 }}
        />
      );
    default:
      return (
        <TextField
          size="small"
          fullWidth
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          inputProps={{ style: { fontSize: "0.78rem" } }}
          sx={{ minWidth: 120 }}
        />
      );
  }
};

const DynamicTable = ({
  config,
  rows,
  onChange,
  readOnly = false,
  theme,
  apiContext,
}: DynamicTableProps) => {
  const flatColumns = flattenTableColumns(config.columns);
  const hasColumnGroups = config.columns.some(isColumnGroup);
  const autoKey = config.rows?.autoIncrementKey ?? "srNo";
  const allowAdd = config.rows?.allowAdd !== false && !readOnly;
  const allowDelete = config.rows?.allowDelete !== false && !readOnly;

  const updateCell = (rowIndex: number, colId: string, value: string) => {
    const nextRows = rows.map((row, idx) => {
      if (idx !== rowIndex) return row;
      const updated = applyFormulaColumns({ ...row, [colId]: value }, flatColumns);
      return updated;
    });
    onChange(nextRows);
  };

  const addRow = () => {
    const row: Record<string, unknown> = { [autoKey]: rows.length + 1 };
    flatColumns.forEach((col) => {
      if (col.fieldType !== "serial") row[col.id] = "";
    });
    onChange([...rows, applyFormulaColumns(row, flatColumns)]);
  };

  const removeRow = (rowIndex: number) => {
    if (rows.length <= (config.rows?.min ?? 1)) return;
    onChange(rows.filter((_, idx) => idx !== rowIndex).map((row, idx) => ({ ...row, [autoKey]: idx + 1 })));
  };

  return (
    <TableContainer sx={{ overflowX: "auto", border: `1px solid ${theme?.border ?? "#D5D8DC"}`, borderRadius: 2 }}>
      {config.label ? (
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: theme?.primary, p: 1 }}>
          {config.label}
        </Typography>
      ) : null}
      <Table size="small" sx={{ tableLayout: "auto", minWidth: "100%" }}>
        <TableHead>
          {hasColumnGroups ? (
            <>
              {renderGroupHeaderRow(config.columns, allowDelete)}
              <TableRow sx={{ background: "rgba(21,101,192,0.06)" }}>
                {renderGroupedSubHeaderCells(config.columns)}
              </TableRow>
            </>
          ) : (
            <TableRow sx={{ background: "rgba(21,101,192,0.06)" }}>
              {renderFlatHeaderCells(config.columns)}
              {allowDelete ? <TableCell sx={{ width: 48, fontWeight: 700, fontSize: "0.72rem" }}>Actions</TableCell> : null}
            </TableRow>
          )}
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => {
            if (row._rowType === "header") {
              return (
                <TableRow key={rowIndex} sx={{ background: "rgba(21,101,192,0.04)" }}>
                  <TableCell
                    colSpan={flatColumns.length + (allowDelete ? 1 : 0)}
                    sx={{ fontWeight: 700, fontSize: "0.78rem", color: theme?.primary }}
                  >
                    {String(row._headerLabel ?? "")}
                  </TableCell>
                </TableRow>
              );
            }

            const rowPresetLocked = isPresetLockedRow(row, rowIndex, config.rows?.presetRows);

            return (
              <TableRow key={rowIndex}>
                {flatColumns.map((col) => {
                  if (col.fieldType === "serial") {
                    return (
                      <TableCell key={col.id}>{String(row[autoKey] ?? rowIndex + 1)}</TableCell>
                    );
                  }
                  const cellValue = String(row[col.id] ?? "");
                  const cellReadOnly =
                    readOnly ||
                    isReadonlyCol(col) ||
                    isPresetLockedCell(row, col.id, rowIndex, config.rows?.presetRows, autoKey);
                  return (
                    <TableCell key={col.id} sx={cellSx(col)}>
                      {renderCellEditor(
                        col,
                        cellValue,
                        (v) => updateCell(rowIndex, col.id, v),
                        cellReadOnly,
                        apiContext,
                      )}
                    </TableCell>
                  );
                })}
                {allowDelete ? (
                  <TableCell>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeRow(rowIndex)}
                      disabled={rows.length <= (config.rows?.min ?? 1) || rowPresetLocked}
                    >
                      Remove
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {allowAdd ? (
        <Button size="small" onClick={addRow} sx={{ m: 1, textTransform: "none", fontWeight: 700 }}>
          Add Row
        </Button>
      ) : null}
    </TableContainer>
  );
};

export default DynamicTable;
