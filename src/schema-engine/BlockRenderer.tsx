import { Box, Typography } from "@mui/material";
import type { SchemaBlock, SchemaFieldBlock, SchemaGroupBlock, SchemaSectionBlock } from "./types";
import type { SchemaApiContext } from "./rules/apiDependency";
import type { SchemaThemeTokens } from "./utils/schemaUtils";
import type { SchemaFormValues } from "./state/formState";
import { setBlockValue, buildRepeatInstanceChildValues, buildTableRows, scopedFormKey } from "./state/formState";
import { isBlockVisible } from "./rules/visibility";
import { resolveSchemaCountToken, type SchemaSetupContext } from "./utils/setupContext";
import { resolveBlockLayoutSx, resolveFullWidthBlockLayoutSx, resolveGridGap } from "./utils/blockLayout";
import {
  createNextPrefixedTableColumn,
  resolveTableExtraColumns,
  resolveTableRows,
  wrapTableValue,
} from "./utils/tableRowUtils";
import FormInput from "../ui/components/common/FormInput";
import SchemaApiDropdown from "../ui/components/common/SchemaApiDropdown";
import DynamicTable from "../ui/components/common/DynamicTable";
import MatrixTable from "../ui/components/common/MatrixTable";
import GridFields from "../ui/components/common/GridFields";
import FileUploadButton from "../ui/components/common/FileUploadButton";
import { DateField, DateTimeField, TimeField } from "../ui/components/common/DateField";
import type { CuringProjectStageMatrix } from "../data/models/user/curingProjectStageMatrix";
import { buildDefaultCuringProjectStageMatrix } from "../data/models/user/curingProjectStageMatrix";

export type BlockRenderContext = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  theme?: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  setupContext?: SchemaSetupContext;
  visibilityContext: Record<string, unknown>;
  batch?: { batchId?: string; projectName?: string; projectId?: string };
  motorId?: string;
  /** Top-level or nested section id used to scope field values in form state. */
  valueScope?: string;
};

const renderField = (block: SchemaFieldBlock, ctx: BlockRenderContext) => {
  const value = String(ctx.values[scopedFormKey(ctx.valueScope, block.id)] ?? "");
  const onFieldChange = (next: string) =>
    ctx.onChange(setBlockValue(ctx.values, block.id, next, ctx.valueScope));
  const disabled = ctx.readOnly || block.readonly;

  switch (block.fieldType) {
    case "textarea":
      return (
        <FormInput
          label={block.label}
          value={value}
          onChange={(e) => onFieldChange(e.target.value)}
          multiline
          minRows={2}
          disabled={disabled}
          required={block.validation?.required}
        />
      );
    case "dropdown":
      return (
        <SchemaApiDropdown
          label={block.label}
          value={value}
          onChange={onFieldChange}
          dataSource={block.dataSource}
          apiContext={ctx.apiContext}
          disabled={disabled}
          required={block.validation?.required}
        />
      );
    case "date":
      return <DateField label={block.label} value={value} onChange={onFieldChange} disabled={disabled} />;
    case "time":
      return <TimeField label={block.label} value={value} onChange={onFieldChange} disabled={disabled} />;
    case "datetime":
      return <DateTimeField label={block.label} value={value} onChange={onFieldChange} disabled={disabled} />;
    case "file":
      return (
        <FileUploadButton
          label={block.label}
          disabled={disabled}
          onChange={(e) => onFieldChange(e.target.files?.[0]?.name ?? "")}
        />
      );
    case "number":
    case "decimal":
      return (
        <FormInput
          label={block.label ? `${block.label}${block.unit ? ` (${block.unit})` : ""}` : undefined}
          value={value}
          type="number"
          onChange={(e) => onFieldChange(e.target.value)}
          disabled={disabled}
          required={block.validation?.required}
        />
      );
    default:
      return (
        <FormInput
          label={block.label}
          value={value}
          onChange={(e) => onFieldChange(e.target.value)}
          disabled={disabled}
          required={block.validation?.required}
        />
      );
  }
};

const renderRepeatSection = (block: SchemaSectionBlock, ctx: BlockRenderContext) => {
  const instances = (Array.isArray(ctx.values[block.id]) ? ctx.values[block.id] : []) as Record<string, unknown>[];
  const min = resolveSchemaCountToken(block.repeat?.min ?? 1, ctx.setupContext);
  const max = resolveSchemaCountToken(block.repeat?.max ?? 20, ctx.setupContext);
  const allowAdd = block.repeat?.allowAdd !== false && !ctx.readOnly;
  const allowDelete = block.repeat?.allowDelete !== false && !ctx.readOnly;

  const updateInstance = (index: number, instance: Record<string, unknown>) => {
    const next = [...instances];
    next[index] = instance;
    ctx.onChange(setBlockValue(ctx.values, block.id, next));
  };

  const addInstance = () => {
    if (instances.length >= max) return;
    ctx.onChange(
      setBlockValue(ctx.values, block.id, [
        ...instances,
        { _key: `${block.id}-${instances.length + 1}`, ...buildRepeatInstanceChildValues(block.children, ctx.setupContext) },
      ]),
    );
  };

  const removeInstance = (index: number) => {
    if (instances.length <= min) return;
    ctx.onChange(setBlockValue(ctx.values, block.id, instances.filter((_, i) => i !== index)));
  };

  return (
    <Box sx={{ mb: 2 }}>
      {instances.map((instance, index) => {
        const label = (block.repeat?.label ?? block.title).replace("{index}", String(index + 1));
        const instanceCtx: BlockRenderContext = {
          ...ctx,
          valueScope: undefined,
          values: {
            ...ctx.values,
            ...Object.fromEntries(
              block.children.map((child) => [child.id, instance[child.id] ?? ctx.values[child.id]]),
            ),
          },
          onChange: (nextValues) => {
            const nextInstance = { ...instance, _key: instance._key ?? `${block.id}-${index + 1}` };
            block.children.forEach((child) => {
              if (nextValues[child.id] !== undefined) {
                nextInstance[child.id] = nextValues[child.id];
              }
            });
            updateInstance(index, nextInstance);
          },
        };

        return (
          <Box key={String(instance._key ?? index)} sx={{ mb: 2, p: 1.5, border: `1px solid ${ctx.theme?.border}`, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", mb: 1, color: ctx.theme?.primary }}>
              {label}
            </Typography>
            <GridFields
              direction={block.ui?.direction ?? "row"}
              wrap={block.ui?.wrap ?? true}
              gap={resolveGridGap(block.ui?.gap)}
            >
              {block.children.map((child) => (
                <BlockRenderer key={child.id} block={child} ctx={instanceCtx} />
              ))}
            </GridFields>
            {allowDelete && instances.length > min ? (
              <Typography
                component="button"
                onClick={() => removeInstance(index)}
                sx={{ fontSize: "0.76rem", color: "error.main", border: 0, background: "none", cursor: "pointer", mt: 1 }}
              >
                {block.repeat?.deleteLabel ?? "Remove"}
              </Typography>
            ) : null}
          </Box>
        );
      })}
      {allowAdd && instances.length < max ? (
        <Typography
          component="button"
          onClick={addInstance}
          sx={{ fontSize: "0.76rem", color: ctx.theme?.primary, border: 0, background: "none", cursor: "pointer", fontWeight: 700 }}
        >
          {block.repeat?.addLabel ?? "Add"}
        </Typography>
      ) : null}
    </Box>
  );
};

const renderGroup = (block: SchemaGroupBlock, ctx: BlockRenderContext) => {
  if (block.repeat) {
    return renderRepeatSection(
      { ...block, type: "section", title: block.label ?? block.id, children: block.children },
      ctx,
    );
  }

  return (
    <GridFields
      direction={block.ui?.direction ?? "row"}
      wrap={block.ui?.wrap ?? true}
      gap={resolveGridGap(block.ui?.gap)}
    >
      {block.children.map((child) => (
        <BlockRenderer key={child.id} block={child} ctx={ctx} />
      ))}
    </GridFields>
  );
};

export const BlockRenderer = ({ block, ctx }: { block: SchemaBlock; ctx: BlockRenderContext }) => {
  if (!isBlockVisible(block, ctx.visibilityContext)) return null;

  switch (block.type) {
    case "field": {
      const isTextarea = block.fieldType === "textarea";
      const hasCustomLayout = Boolean(block.ui?.colSpan || block.ui?.flex || block.ui?.width);
      const layoutSx = isTextarea && !hasCustomLayout
        ? resolveFullWidthBlockLayoutSx(block.ui)
        : resolveBlockLayoutSx(block.ui);

      return (
        <Box
          sx={layoutSx}
          {...(hasCustomLayout || isTextarea ? { "data-custom-flex": true } : {})}
        >
          {renderField(block, ctx)}
        </Box>
      );
    }
    case "table": {
      const storedValue = ctx.values[scopedFormKey(ctx.valueScope, block.id)];
      const extraColumns = resolveTableExtraColumns(storedValue);
      const rows = resolveTableRows(storedValue, block, buildTableRows);
      const mergedColumns = [...block.columns, ...extraColumns];

      const handleTableChange = (nextRows: Record<string, unknown>[]) => {
        const nextValue =
          block.allowAddColumn || block.allowDeleteColumn || extraColumns.length > 0
            ? wrapTableValue(nextRows, extraColumns)
            : nextRows;
        ctx.onChange(setBlockValue(ctx.values, block.id, nextValue, ctx.valueScope));
      };

      const handleAddColumn = () => {
        if (!block.allowAddColumn) return;
        const column = createNextPrefixedTableColumn(block, extraColumns);
        const nextExtraColumns = [...extraColumns, column];
        const nextRows = rows.map((row) => ({ ...row, [column.id]: row[column.id] ?? "" }));
        ctx.onChange(setBlockValue(ctx.values, block.id, wrapTableValue(nextRows, nextExtraColumns), ctx.valueScope));
      };

      const handleDeleteColumn = (columnId: string) => {
        if (!block.allowDeleteColumn) return;
        const nextExtraColumns = extraColumns.filter((col) => col.id !== columnId);
        const nextRows = rows.map((row) => {
          const { [columnId]: _removed, ...rest } = row;
          return rest;
        });
        ctx.onChange(setBlockValue(ctx.values, block.id, wrapTableValue(nextRows, nextExtraColumns), ctx.valueScope));
      };

      return (
        <Box sx={resolveFullWidthBlockLayoutSx(block.ui)} data-custom-flex>
          <DynamicTable
            config={{ ...block, columns: mergedColumns }}
            rows={rows}
            onChange={handleTableChange}
            readOnly={ctx.readOnly}
            theme={ctx.theme}
            apiContext={ctx.apiContext}
            allowAddColumn={block.allowAddColumn}
            onAddColumn={block.allowAddColumn ? handleAddColumn : undefined}
            allowDeleteColumn={block.allowDeleteColumn}
            deletableColumnIds={extraColumns.map((col) => col.id)}
            onDeleteColumn={block.allowDeleteColumn ? handleDeleteColumn : undefined}
          />
        </Box>
      );
    }
    case "matrix": {
      const matrixValue = (ctx.values[scopedFormKey(ctx.valueScope, block.id)] ?? { columns: [], rows: [] }) as CuringProjectStageMatrix;
      const resolved =
        matrixValue.rows?.length > 0
          ? matrixValue
          : buildDefaultCuringProjectStageMatrix(ctx.batch ?? {}, ctx.motorId ?? "", []);
      return (
        <Box sx={resolveFullWidthBlockLayoutSx(block.ui)} data-custom-flex>
          <MatrixTable
            config={block}
            value={resolved}
            onChange={(next) => ctx.onChange(setBlockValue(ctx.values, block.id, next, ctx.valueScope))}
            readOnly={ctx.readOnly}
            theme={ctx.theme}
            apiContext={ctx.apiContext}
            batch={ctx.batch}
            motorId={ctx.motorId}
          />
        </Box>
      );
    }
    case "section":
      if (block.repeat) return renderRepeatSection(block, ctx);
      return (
        <>
          {block.children.map((child) => (
            <BlockRenderer key={child.id} block={child} ctx={{ ...ctx, valueScope: block.id }} />
          ))}
        </>
      );
    case "group":
      return renderGroup(block, ctx);
    case "display":
      return (
        <Typography sx={{ fontSize: "0.84rem", mb: 1 }}>
          {block.label}: {block.value ?? ""}
        </Typography>
      );
    default:
      return null;
  }
};

export default BlockRenderer;
