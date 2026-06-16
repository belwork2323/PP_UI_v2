import type { SchemaBlock, SchemaDocumentV2, SchemaFieldBlock, SchemaRepeatConfig, SchemaSection, SchemaTableBlock } from "../types";
import { applyFormulaColumns } from "../rules/formulaEval";
import { resolveSchemaCountToken, type SchemaSetupContext } from "../utils/setupContext";
import { flattenTableColumns, walkBlocks } from "../utils/schemaUtils";
import { PRESET_ROW_META_KEYS, TABLE_ROW_RUNTIME_KEYS } from "../utils/tableRowUtils";

export type SchemaFormValues = Record<string, unknown>;

export type SchemaSectionSubmission = {
  sectionId: string;
  sectionData: unknown[];
};

export const cloneValue = <T>(value: T): T => {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
};

const columnDefault = (col: { defaultValue?: unknown; defaultValues?: unknown[] }, rowIndex: number) => {
  if (Array.isArray(col.defaultValues) && col.defaultValues[rowIndex] !== undefined) {
    return col.defaultValues[rowIndex];
  }
  return col.defaultValue ?? "";
};


const buildTableRows = (table: SchemaTableBlock): Record<string, unknown>[] => {
  const columns = flattenTableColumns(table.columns);
  const autoKey = table.rows?.autoIncrementKey ?? "srNo";
  const presetRows = table.rows?.presetRows ?? [];
  const count = Math.max(table.rows?.defaultCount ?? 1, presetRows.length);

  return Array.from({ length: count }, (_, rowIndex) => {
    const preset = presetRows[rowIndex] ?? {};
    const row: Record<string, unknown> = {};

    if (preset.type === "header") {
      row._rowType = "header";
      row._headerLabel = preset.label ?? "";
    }
    if (preset.readonly === true) {
      row._readonly = true;
      row._readonlyColumns = Object.keys(preset).filter(
        (key) => !PRESET_ROW_META_KEYS.has(key) && key !== autoKey,
      );
    }

    row[autoKey] = preset[autoKey] ?? rowIndex + 1;

    columns.forEach((col) => {
      if (col.fieldType === "serial") return;
      if (col.id in preset && preset[col.id] !== undefined) {
        row[col.id] = preset[col.id];
      } else {
        row[col.id] = columnDefault(col, rowIndex);
      }
    });

    return applyFormulaColumns(row, columns);
  });
};

const initRepeatChildValues = (
  children: SchemaBlock[],
  setupContext?: SchemaSetupContext,
): Record<string, unknown> => {
  const instance: Record<string, unknown> = {};
  children.forEach((child) => {
    instance[child.id] = initBlockValue(child, setupContext);
  });
  return instance;
};

export const buildRepeatInstanceChildValues = initRepeatChildValues;

const buildRepeatInstances = (
  blockId: string,
  repeat: SchemaRepeatConfig | undefined,
  childInit: () => Record<string, unknown>,
  setupContext?: SchemaSetupContext,
) => {
  const count = resolveSchemaCountToken(repeat?.defaultCount ?? 1, setupContext);
  return Array.from({ length: count }, (_, index) => ({
    _key: `${blockId}-${index + 1}`,
    ...childInit(),
  }));
};

const initBlockValue = (
  block: SchemaBlock,
  setupContext?: SchemaSetupContext,
): unknown => {
  switch (block.type) {
    case "field":
      return block.defaultValue ?? "";
    case "table":
      return buildTableRows(block);
    case "matrix":
      return { columns: [], rows: [] };
    case "group":
      if (block.repeat) {
        return buildRepeatInstances(
          block.id,
          block.repeat,
          () => initRepeatChildValues(block.children, setupContext),
          setupContext,
        );
      }
      return [{}];
    case "section":
      if (block.repeat) {
        return buildRepeatInstances(
          block.id,
          block.repeat,
          () => initRepeatChildValues(block.children, setupContext),
          setupContext,
        );
      }
      return undefined;
    default:
      return undefined;
  }
};

export const buildInitialFormValues = (
  schema: SchemaDocumentV2,
  setupContext?: SchemaSetupContext,
): SchemaFormValues => {
  const values: SchemaFormValues = {};

  const assignBlock = (block: SchemaBlock) => {
    if (block.type === "section" && block.repeat) {
      values[block.id] = initBlockValue(block, setupContext);
      return;
    }
    if (block.type === "section") {
      (block.children ?? []).forEach(assignBlock);
      return;
    }
    if (block.type === "group") {
      values[block.id] = initBlockValue(block, setupContext);
      return;
    }
    if (block.type === "field" || block.type === "table" || block.type === "matrix") {
      values[block.id] = initBlockValue(block, setupContext);
    }
  };

  schema.data.sections.forEach((section) => {
    (section.children ?? []).forEach(assignBlock);
  });
  return values;
};

const sanitizeSubmissionValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeSubmissionValue);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      if (TABLE_ROW_RUNTIME_KEYS.has(key)) return;
      out[key] = sanitizeSubmissionValue(val);
    });
    return out;
  }
  return value;
};

const collectSectionRow = (blocks: SchemaBlock[], values: SchemaFormValues): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  blocks.forEach((block) => {
    if (block.type === "field" || block.type === "table" || block.type === "matrix" || block.type === "group") {
      if (values[block.id] !== undefined) {
        row[block.id] = sanitizeSubmissionValue(cloneValue(values[block.id]));
      }
    }
    if (block.type === "section" && block.repeat) {
      row[block.id] = sanitizeSubmissionValue(cloneValue(values[block.id] ?? []));
    } else if (block.type === "section") {
      Object.assign(row, collectSectionRow(block.children ?? [], values));
    }
  });
  return row;
};

export const toSectionSubmissions = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] =>
  schema.data.sections.map((section) => ({
    sectionId: section.id,
    sectionData: [collectSectionRow(section.children ?? [], values)],
  }));

export const mergeSectionDataIntoValues = (
  schema: SchemaDocumentV2,
  savedSections: SchemaSectionSubmission[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues => {
  const initial = buildInitialFormValues(schema, setupContext);
  const savedById = Object.fromEntries(savedSections.map((s) => [s.sectionId, s.sectionData]));

  schema.data.sections.forEach((section) => {
    const saved = savedById[section.id];
    if (!Array.isArray(saved) || saved.length === 0) return;
    const savedRow = saved[0];
    if (!savedRow || typeof savedRow !== "object") return;

    walkBlocks(section.children ?? [], (block) => {
      if (!(block.id in (savedRow as Record<string, unknown>))) return;
      initial[block.id] = cloneValue((savedRow as Record<string, unknown>)[block.id]);
    });
  });

  return initial;
};

export const schemaValuesHaveUserData = (values: SchemaFormValues): boolean => {
  const hasContent = (val: unknown): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number" || typeof val === "boolean") return true;
    if (Array.isArray(val)) return val.some(hasContent);
    if (typeof val === "object") {
      return Object.entries(val as Record<string, unknown>).some(([key, v]) => {
        if (key.startsWith("_")) return false;
        return hasContent(v);
      });
    }
    return false;
  };

  return Object.values(values).some(hasContent);
};

export const getBlockValue = (values: SchemaFormValues, blockId: string) => values[blockId];

export const setBlockValue = (values: SchemaFormValues, blockId: string, value: unknown): SchemaFormValues => ({
  ...values,
  [blockId]: value,
});
