import { Box, Button, Stack, Typography } from "@mui/material";
import type { SchemaApiContext, SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import { cloneSchemaRow } from "../../models/schemaFormState";
import TableSection from "./TableSection";

export type RepeatableTableCycle = {
  _cycleKey: string;
  rows: Record<string, unknown>[];
};

type RepeatableTableSectionProps = {
  section: SchemaSection;
  cycles: RepeatableTableCycle[];
  onCyclesChange: (cycles: RepeatableTableCycle[]) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const buildCycleLabel = (pattern: string, index: number) =>
  pattern.replace("{index}", String(index)).replace("{index}", String(index));

const buildDefaultRows = (section: SchemaSection) => {
  const count = Number(section.defaultRowCount ?? 1) || 1;
  const columns = section.columns ?? [];

  return Array.from({ length: count }, (_, rowIndex) => {
    const row: Record<string, unknown> = { srNo: rowIndex + 1 };
    columns.forEach((column) => {
      if (column.key !== "srNo") row[column.key] = "";
    });
    return row;
  });
};

const RepeatableTableSection = ({
  section,
  cycles,
  onCyclesChange,
  readOnly = false,
  theme,
  apiContext,
}: RepeatableTableSectionProps) => {
  const repeatConfig = section.repeatConfig ?? {};
  const labelPattern = repeatConfig.labelPattern ?? "Cycle {index}";
  const allowAdd = repeatConfig.allowAdd !== false;
  const allowDelete = repeatConfig.allowDelete !== false;
  const displayCycles =
    cycles.length > 0
      ? cycles
      : [{ _cycleKey: "cycle-1", rows: buildDefaultRows(section) }];

  const updateCycleRows = (cycleKey: string, rows: Record<string, unknown>[]) => {
    onCyclesChange(
      displayCycles.map((cycle) =>
        cycle._cycleKey === cycleKey ? { ...cycle, rows } : cycle,
      ),
    );
  };

  const addCycle = () => {
    const nextIndex = displayCycles.length + 1;
    onCyclesChange([
      ...displayCycles,
      {
        _cycleKey: `cycle-${Date.now()}`,
        rows: buildDefaultRows(section),
      },
    ]);
    void nextIndex;
  };

  const removeCycle = (cycleKey: string) => {
    if (displayCycles.length <= 1) return;
    onCyclesChange(displayCycles.filter((cycle) => cycle._cycleKey !== cycleKey));
  };

  return (
    <Stack spacing={2}>
      {displayCycles.map((cycle, cycleIndex) => (
        <Box
          key={cycle._cycleKey}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.border}`,
            p: 1.5,
            background: theme.surface,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", color: theme.text }}>
              {buildCycleLabel(labelPattern, cycleIndex + 1)}
            </Typography>
            {allowDelete && !readOnly && displayCycles.length > 1 ? (
              <Button
                size="small"
                color="error"
                onClick={() => removeCycle(cycle._cycleKey)}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Remove
              </Button>
            ) : null}
          </Stack>

          <TableSection
            section={{
              ...section,
              type: "table",
              sectionId: `${section.sectionId}__${cycle._cycleKey}`,
              defaultRows: cycle.rows.map((row) => cloneSchemaRow(row)),
            }}
            rows={cycle.rows}
            onRowsChange={(rows) => updateCycleRows(cycle._cycleKey, rows)}
            readOnly={readOnly}
            theme={theme}
            apiContext={apiContext}
          />
        </Box>
      ))}

      {allowAdd && !readOnly ? (
        <Button
          variant="outlined"
          size="small"
          onClick={addCycle}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
        >
          Add {buildCycleLabel(labelPattern, displayCycles.length + 1)}
        </Button>
      ) : null}
    </Stack>
  );
};

export default RepeatableTableSection;
