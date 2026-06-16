import type {
  SchemaBlock,
  SchemaDocumentV2,
  SchemaFieldBlock,
  SchemaSection,
  SchemaTableBlock,
  SchemaTableColumn,
  SchemaTableColumnGroup,
  SchemaTableColumnSlot,
} from "../types";

export const isColumnGroup = (slot: SchemaTableColumnSlot): slot is SchemaTableColumnGroup =>
  slot.type === "group";

export const flattenTableColumns = (columns: SchemaTableColumnSlot[]): SchemaTableColumn[] => {
  const result: SchemaTableColumn[] = [];
  columns.forEach((slot) => {
    if (slot.type === "column") {
      result.push(slot);
      return;
    }
    if (slot.type === "group") {
      result.push(...slot.columns);
    }
  });
  return result;
};

export const walkBlocks = (
  blocks: SchemaBlock[] | undefined,
  visitor: (block: SchemaBlock, path: string[]) => void,
  path: string[] = [],
) => {
  (blocks ?? []).forEach((block) => {
    visitor(block, path);
    if (block.type === "section" || block.type === "group") {
      walkBlocks(block.children, visitor, [...path, block.id]);
    }
  });
};

export const getAllBlocks = (sections: SchemaSection[]): SchemaBlock[] => {
  const blocks: SchemaBlock[] = [];
  sections.forEach((section) => {
    walkBlocks(section.children, (block) => blocks.push(block));
  });
  return blocks;
};

export const getFieldBlocks = (sections: SchemaSection[]): SchemaFieldBlock[] =>
  getAllBlocks(sections).filter((b): b is SchemaFieldBlock => b.type === "field");

export const getTableBlocks = (sections: SchemaSection[]): SchemaTableBlock[] =>
  getAllBlocks(sections).filter((b): b is SchemaTableBlock => b.type === "table");

export const parseSchemaDocument = (response: unknown): SchemaDocumentV2 | null => {
  if (!response || typeof response !== "object") return null;

  const root = response as Record<string, unknown>;

  const documentRoot = (
    "success" in root && root.data && typeof root.data === "object"
      ? root.data
      : root
  ) as Record<string, unknown>;

  const dataPayload = (
    documentRoot.data && typeof documentRoot.data === "object"
      ? documentRoot.data
      : documentRoot
  ) as Record<string, unknown>;

  const sections = Array.isArray(dataPayload.sections)
    ? dataPayload.sections
    : Array.isArray(documentRoot.sections)
      ? documentRoot.sections
      : Array.isArray(root.sections)
        ? root.sections
        : null;

  if (!sections) return null;

  return {
    schemaVersion: String(
      documentRoot.schemaVersion ?? root.schemaVersion ?? dataPayload.schemaVersion ?? "1.0",
    ),
    schemaType: String(documentRoot.schemaType ?? root.schemaType ?? dataPayload.schemaType ?? ""),
    functionality: String(
      documentRoot.functionality ?? root.functionality ?? dataPayload.functionality ?? "",
    ),
    meta: (dataPayload.meta ?? documentRoot.meta ?? root.meta) as SchemaDocumentV2["meta"],
    data: {
      ui: (dataPayload.ui ?? documentRoot.ui ?? root.ui) as SchemaDocumentV2["data"]["ui"],
      context: (dataPayload.context ?? documentRoot.context ?? root.context) as SchemaDocumentV2["data"]["context"],
      sections: sections as SchemaSection[],
    },
  };
};

export type SchemaThemeTokens = {
  primary: string;
  primaryLight: string;
  accent: string;
  text: string;
  textSub: string;
  border: string;
  surface: string;
  warn: string;
};

export const defaultThemeTokens: SchemaThemeTokens = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
  accent: "#1565C0",
  text: "#1C2833",
  textSub: "#5D6D7E",
  border: "#D5D8DC",
  surface: "#F4F6F8",
  warn: "#D4AC0D",
};

export const mergeThemeFromDesignSystem = (
  base: SchemaThemeTokens,
  designSystem?: SchemaDocumentV2["data"]["ui"] extends infer U
    ? U extends { designSystem?: infer D }
      ? D
      : never
    : never,
): SchemaThemeTokens => {
  const colors = (designSystem as { colors?: Record<string, string> } | undefined)?.colors;
  if (!colors) return base;
  return {
    ...base,
    primary: colors.primary ?? base.primary,
    primaryLight: colors.primaryLight ?? base.primaryLight,
    text: colors.text ?? base.text,
    textSub: colors.textSub ?? base.textSub,
    border: colors.border ?? base.border,
    surface: colors.surface ?? base.surface,
    warn: colors.warn ?? base.warn,
  };
};
