import type {
  SchemaDataSource,
  SchemaFieldBlock,
  SchemaRootUi,
  SchemaSection,
  SchemaTableBlock,
  SchemaTableColumn,
} from "../types";

type ApiField = {
  fieldId?: string;
  id?: string;
  label?: string;
  type?: string;
  readonly?: boolean;
  required?: boolean;
  unit?: string;
  formula?: string;
  dataSource?: string;
};

type ApiTableColumn = ApiField;

type ApiTableRow = {
  rowId?: string;
  dimension?: string;
  measurementType?: string;
  parameter?: string;
};

type ApiSpecialRow = {
  rowId?: string;
  type?: string;
  instruction?: string;
};

type ApiTable = {
  tableId?: string;
  id?: string;
  title?: string;
  tableType?: string;
  dynamicRows?: boolean;
  addRowAllowed?: boolean;
  rowGenerationType?: string;
  rowGenerationSource?: string;
  rowHeaders?: string[];
  rows?: ApiTableRow[];
  specialRows?: ApiSpecialRow[];
  columns?: ApiTableColumn[];
};

type ApiSection = {
  sectionId?: string;
  sectionName?: string;
  id?: string;
  title?: string;
  type?: string;
  addRowAllowed?: boolean;
  columns?: ApiTableColumn[];
  fields?: ApiField[];
  tables?: ApiTable[];
  ui?: SchemaSection["ui"];
  children?: SchemaSection["children"];
};

const mapFieldType = (
  type: string | undefined,
  readonly?: boolean,
): { fieldType: string; readonly?: boolean } => {
  const normalized = String(type ?? "").toLowerCase();
  if (normalized === "autoincrement") return { fieldType: "serial" };
  if (normalized === "readonly") return { fieldType: "text", readonly: true };
  if (normalized === "formula") return { fieldType: "formula" };
  return { fieldType: normalized || "text", readonly: readonly || undefined };
};

const mapDataSource = (dataSource?: string): SchemaDataSource | undefined => {
  const key = String(dataSource ?? "").trim();
  if (!key) return undefined;
  return { type: "api", api: { endpoint: key } };
};

const applyFieldMeta = (
  block: { validation?: { required?: boolean }; unit?: string; readonly?: boolean },
  field: ApiField,
  mapped: { fieldType: string; readonly?: boolean },
) => {
  if (mapped.readonly) block.readonly = true;
  if (field.required) {
    block.validation = { ...(block.validation ?? {}), required: true };
  }
  if (field.unit) block.unit = String(field.unit);
};

const normalizeApiField = (field: ApiField): SchemaFieldBlock => {
  const mapped = mapFieldType(field.type, field.readonly);
  const block: SchemaFieldBlock = {
    type: "field",
    id: String(field.fieldId ?? field.id ?? ""),
    fieldType: mapped.fieldType,
    label: field.label ? String(field.label) : undefined,
  };

  applyFieldMeta(block, field, mapped);

  const dataSource = mapDataSource(field.dataSource);
  if (dataSource) block.dataSource = dataSource;

  if (field.formula) {
    block.formula = { expression: String(field.formula) };
    block.readonly = true;
  }

  return block;
};

const normalizeApiTableColumn = (column: ApiTableColumn): SchemaTableColumn => {
  const mapped = mapFieldType(column.type, column.readonly);
  const col: SchemaTableColumn = {
    type: "column",
    id: String(column.fieldId ?? column.id ?? ""),
    fieldType: mapped.fieldType,
    label: column.label ? String(column.label) : undefined,
  };

  applyFieldMeta(col, column, mapped);

  const dataSource = mapDataSource(column.dataSource);
  if (dataSource) col.dataSource = dataSource;

  if (column.formula) {
    col.formula = { expression: String(column.formula) };
    col.readonly = true;
  }

  return col;
};

const buildPresetRowsFromApiTable = (table: ApiTable): Record<string, unknown>[] => {
  const specialByRowId = new Map(
    (table.specialRows ?? []).map((row) => [String(row.rowId ?? ""), row]),
  );

  if (table.rowHeaders?.length) {
    return table.rowHeaders.map((header) => ({
      readonly: true,
      ROW_LABEL: header,
    }));
  }

  if (!table.rows?.length) return [];

  const presetRows: Record<string, unknown>[] = [];
  table.rows.forEach((row) => {
    const rowId = String(row.rowId ?? "");
    const special = specialByRowId.get(rowId);
    if (special?.type === "instruction") {
      presetRows.push({
        type: "header",
        label: special.instruction ?? "",
      });
    }

    const preset: Record<string, unknown> = { readonly: true };
    if (row.dimension) preset.DIMENSION = row.dimension;
    if (row.measurementType) preset.MEASUREMENT_TYPE = row.measurementType;
    if (row.parameter) preset.PARAMETER = row.parameter;
    presetRows.push(preset);
  });

  return presetRows;
};

const injectLeadingColumns = (
  columns: SchemaTableColumn[],
  presetRows: Record<string, unknown>[],
): SchemaTableColumn[] => {
  const existingIds = new Set(columns.map((column) => column.id));
  const prefix: SchemaTableColumn[] = [];

  if (presetRows.some((row) => row.ROW_LABEL !== undefined) && !existingIds.has("ROW_LABEL")) {
    prefix.push({
      type: "column",
      id: "ROW_LABEL",
      fieldType: "static",
      label: "Row",
      readonly: true,
    });
  }
  if (presetRows.some((row) => row.DIMENSION !== undefined) && !existingIds.has("DIMENSION")) {
    prefix.push({
      type: "column",
      id: "DIMENSION",
      fieldType: "static",
      label: "Dimension",
      readonly: true,
    });
  }
  if (
    presetRows.some((row) => row.MEASUREMENT_TYPE !== undefined) &&
    !existingIds.has("MEASUREMENT_TYPE")
  ) {
    prefix.push({
      type: "column",
      id: "MEASUREMENT_TYPE",
      fieldType: "static",
      label: "Measurement",
      readonly: true,
    });
  }
  if (presetRows.some((row) => row.PARAMETER !== undefined) && !existingIds.has("PARAMETER")) {
    prefix.push({
      type: "column",
      id: "PARAMETER",
      fieldType: "static",
      label: "Parameter",
      readonly: true,
    });
  }

  return [...prefix, ...columns];
};

const normalizeApiTable = (table: ApiTable): SchemaTableBlock => {
  const presetRows = buildPresetRowsFromApiTable(table);
  const hasFixedRows = presetRows.length > 0;
  const allowAdd =
    !hasFixedRows && (table.addRowAllowed ?? table.dynamicRows !== false);
  const columns = injectLeadingColumns(
    (table.columns ?? []).map(normalizeApiTableColumn),
    presetRows,
  );
  const serialColumn = columns.find((column) => column.fieldType === "serial");

  return {
    type: "table",
    id: String(table.tableId ?? table.id ?? ""),
    title: table.title ? String(table.title) : undefined,
    rows: {
      allowAdd,
      allowDelete: allowAdd,
      autoIncrementKey: serialColumn?.id ?? "SR_NO",
      defaultCount: hasFixedRows ? presetRows.length : undefined,
      presetRows: hasFixedRows ? presetRows : undefined,
      ...(table.rowGenerationSource
        ? { rowGenerationSource: String(table.rowGenerationSource) }
        : {}),
    },
    columns,
  };
};

export const isApiStyleSection = (section: unknown): section is ApiSection => {
  if (!section || typeof section !== "object") return false;
  const row = section as ApiSection;
  if (Array.isArray(row.children)) return false;
  return Boolean(
    row.sectionId ||
      row.fields?.length ||
      row.tables?.length ||
      (row.type === "table" && row.columns?.length) ||
      (row.type === "stageSpecific" && row.tables?.length),
  );
};

export const isApiStyleSections = (sections: unknown[]): boolean =>
  sections.some((section) => isApiStyleSection(section));

export const normalizeApiSection = (section: ApiSection): SchemaSection => {
  if (section.id && Array.isArray(section.children)) {
    return section as unknown as SchemaSection;
  }

  let children: SchemaSection["children"] = [];

  if (section.type === "table" && section.columns?.length) {
    children = [
      normalizeApiTable({
        tableId: section.sectionId ?? section.id,
        columns: section.columns,
        addRowAllowed: section.addRowAllowed,
        dynamicRows: section.addRowAllowed !== false,
      }),
    ];
  } else if (section.type === "stageSpecific" && section.tables?.length) {
    children = section.tables.map((table, index) =>
      normalizeApiTable({
        ...table,
        tableId: table.tableId ?? `${section.sectionId ?? section.id ?? "TABLE"}_${index}`,
      }),
    );
  } else {
    children = [
      ...(section.fields ?? []).map(normalizeApiField),
      ...(section.tables ?? []).map(normalizeApiTable),
    ];
  }

  return {
    id: String(section.sectionId ?? section.id ?? ""),
    title: String(section.sectionName ?? section.title ?? ""),
    ...(section.ui ? { ui: section.ui } : {}),
    children,
  };
};

export const normalizeApiSchemaSections = (sections: unknown[]): SchemaSection[] =>
  sections.map((section) =>
    isApiStyleSection(section) ? normalizeApiSection(section) : (section as SchemaSection),
  );

export const resolveSchemaRootUi = (
  dataPayload: Record<string, unknown>,
  envelope: Record<string, unknown>,
): SchemaRootUi | undefined => {
  const ui = (dataPayload.ui ?? envelope.ui) as SchemaRootUi | undefined;
  const layout = dataPayload.layout as { type?: string } | undefined;
  if (!layout?.type) return ui;

  return {
    ...(ui ?? {}),
    layout: layout.type,
  };
};
