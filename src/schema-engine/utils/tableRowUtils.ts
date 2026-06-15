/** Metadata keys on preset row objects — not column ids */
export const PRESET_ROW_META_KEYS = new Set(["type", "readonly", "label"]);

/** Runtime-only row keys — never submitted */
export const TABLE_ROW_RUNTIME_KEYS = new Set([
  "_rowType",
  "_headerLabel",
  "_readonly",
  "_readonlyColumns",
  "_key",
]);

export const getPresetLockedColumnIds = (
  row: Record<string, unknown>,
  rowIndex: number,
  presetRows?: Record<string, unknown>[],
  autoKey = "srNo",
): string[] => {
  if (Array.isArray(row._readonlyColumns)) {
    return row._readonlyColumns as string[];
  }

  const preset = presetRows?.[rowIndex];
  if (preset?.readonly !== true) return [];

  return Object.keys(preset).filter(
    (key) => !PRESET_ROW_META_KEYS.has(key) && key !== autoKey,
  );
};

export const isPresetLockedCell = (
  row: Record<string, unknown>,
  colId: string,
  rowIndex: number,
  presetRows?: Record<string, unknown>[],
  autoKey = "srNo",
): boolean => getPresetLockedColumnIds(row, rowIndex, presetRows, autoKey).includes(colId);

export const isPresetLockedRow = (
  row: Record<string, unknown>,
  rowIndex: number,
  presetRows?: Record<string, unknown>[],
): boolean => {
  if (row._readonly === true) return true;
  return presetRows?.[rowIndex]?.readonly === true;
};
