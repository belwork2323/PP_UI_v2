import type { SchemaBlock, SchemaSection, SchemaVisibleWhen } from "../types";

export type SchemaVisibilityTarget = {
  visibleWhen?: SchemaVisibleWhen;
};

const normalizeScalar = (value: unknown) => String(value ?? "").trim();

const normalizeOp = (op?: string) => String(op ?? "EQ").trim().toUpperCase();

export const buildFlatVisibilityContext = (
  values: Record<string, unknown>,
  extra: Record<string, unknown> = {},
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...extra };

  const walk = (val: unknown) => {
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (item && typeof item === "object") {
          Object.entries(item as Record<string, unknown>).forEach(([key, v]) => {
            if (key.startsWith("_")) return;
            if (Array.isArray(v) || (v && typeof v === "object" && !Array.isArray(v))) {
              walk(v);
            } else {
              merged[key] = v;
            }
          });
        }
      });
      return;
    }
    if (val && typeof val === "object") {
      Object.assign(merged, val as Record<string, unknown>);
    }
  };

  Object.values(values).forEach(walk);
  return merged;
};

const evaluateCondition = (
  rule: { field: string; op?: string; value?: unknown },
  context: Record<string, unknown>,
): boolean => {
  const actual = context[rule.field];
  const expected = rule.value;
  const op = normalizeOp(rule.op);

  switch (op) {
    case "EQUAL":
    case "EQ":
    case "EQUALS":
      return normalizeScalar(actual) === normalizeScalar(expected);
    case "NOT_EQUAL":
    case "NOT_EQUALS":
    case "NEQ":
    case "NOT_EQ":
      return normalizeScalar(actual) !== normalizeScalar(expected);
    case "EMPTY":
    case "IS_EMPTY":
      return normalizeScalar(actual) === "";
    case "NOT_EMPTY":
    case "IS_NOT_EMPTY":
      return normalizeScalar(actual) !== "";
    case "IN":
      return Array.isArray(expected)
        ? expected.map(normalizeScalar).includes(normalizeScalar(actual))
        : normalizeScalar(actual) === normalizeScalar(expected);
    default:
      return normalizeScalar(actual) === normalizeScalar(expected);
  }
};

export const isSchemaVisible = (
  target: SchemaVisibilityTarget | null | undefined,
  context: Record<string, unknown>,
): boolean => {
  if (!target?.visibleWhen?.when?.length) return true;
  const logic = target.visibleWhen.logic ?? "AND";
  const results = target.visibleWhen.when.map((rule) => evaluateCondition(rule, context));
  return logic === "OR" ? results.some(Boolean) : results.every(Boolean);
};

export const isSectionVisible = (
  section: SchemaSection,
  context: Record<string, unknown>,
): boolean => isSchemaVisible(section, context);

export const isBlockVisible = (
  block: SchemaBlock,
  context: Record<string, unknown>,
): boolean => isSchemaVisible(block, context);

export const pruneHiddenFormValues = (
  sections: SchemaSection[],
  values: Record<string, unknown>,
): Record<string, unknown> => {
  const context = buildFlatVisibilityContext(values);
  const next = { ...values };

  const clearBlock = (block: SchemaBlock) => {
    if (!isBlockVisible(block, context)) {
      if (block.type === "field") next[block.id] = "";
    }
    if (block.type === "section" || block.type === "group") {
      block.children.forEach(clearBlock);
    }
  };

  sections.forEach((section) => {
    if (!isSectionVisible(section, context)) return;
    section.children.forEach(clearBlock);
  });

  return next;
};
