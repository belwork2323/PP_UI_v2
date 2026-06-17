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
  formula?: string;
  dataSource?: string;
};

type ApiTableColumn = ApiField;

type ApiTable = {
  tableId?: string;
  id?: string;
  dynamicRows?: boolean;
  rowGenerationSource?: string;
  columns?: ApiTableColumn[];
};

type ApiSection = {
  sectionId?: string;
  sectionName?: string;
  id?: string;
  title?: string;
  fields?: ApiField[];
  tables?: ApiTable[];
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

const normalizeApiField = (field: ApiField): SchemaFieldBlock => {
  const { fieldType, readonly } = mapFieldType(field.type, field.readonly);
  const block: SchemaFieldBlock = {
    type: "field",
    id: String(field.fieldId ?? field.id ?? ""),
    fieldType,
    label: field.label ? String(field.label) : undefined,
  };

  if (readonly) block.readonly = true;

  const dataSource = mapDataSource(field.dataSource);
  if (dataSource) block.dataSource = dataSource;

  if (field.formula) {
    block.formula = { expression: String(field.formula) };
    block.readonly = true;
  }

  return block;
};

const normalizeApiTableColumn = (column: ApiTableColumn): SchemaTableColumn => {
  const { fieldType, readonly } = mapFieldType(column.type, column.readonly);
  const col: SchemaTableColumn = {
    type: "column",
    id: String(column.fieldId ?? column.id ?? ""),
    fieldType,
    label: column.label ? String(column.label) : undefined,
  };

  if (readonly) col.readonly = true;

  const dataSource = mapDataSource(column.dataSource);
  if (dataSource) col.dataSource = dataSource;

  if (column.formula) {
    col.formula = { expression: String(column.formula) };
    col.readonly = true;
  }

  return col;
};

const normalizeApiTable = (table: ApiTable): SchemaTableBlock => {
  const columns = (table.columns ?? []).map(normalizeApiTableColumn);
  const serialColumn = columns.find((col) => col.fieldType === "serial");

  return {
    type: "table",
    id: String(table.tableId ?? table.id ?? ""),
    rows: {
      allowAdd: table.dynamicRows !== false,
      allowDelete: table.dynamicRows !== false,
      autoIncrementKey: serialColumn?.id ?? "SR_NO",
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
  return Boolean(row.sectionId || row.fields?.length || row.tables?.length);
};

export const isApiStyleSections = (sections: unknown[]): boolean =>
  sections.some((section) => isApiStyleSection(section));

export const normalizeApiSection = (section: ApiSection): SchemaSection => {
  if (section.id && Array.isArray(section.children)) {
    return section as unknown as SchemaSection;
  }

  const children = [
    ...(section.fields ?? []).map(normalizeApiField),
    ...(section.tables ?? []).map(normalizeApiTable),
  ];

  return {
    id: String(section.sectionId ?? section.id ?? ""),
    title: String(section.sectionName ?? section.title ?? ""),
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
