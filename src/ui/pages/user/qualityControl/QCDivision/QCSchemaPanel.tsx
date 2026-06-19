import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createQcInitialValues,
  hydrateQcValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";

type QCSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
};

const QCSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  subDepartmentId,
  batchId,
  onChange,
  loading = false,
  error = null,
}: QCSchemaPanelProps) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [savedSections, schema?.schemaVersion, schema?.data?.context]);

  useEffect(() => {
    if (!schema) return;
    if (hydratedRef.current) return;

    if (savedSections?.length) {
      onChange(hydrateQcValuesFromSections(schema, savedSections));
    } else if (Object.keys(formValues ?? {}).length === 0) {
      onChange(createQcInitialValues(schema));
    }
    hydratedRef.current = true;
  }, [schema, savedSections]);

  const themeTokens = useMemo(
    () => ({
      primary: QC_DIVISION_BRAND.primary,
      primaryLight: QC_DIVISION_BRAND.primaryLight,
      accent: QC_DIVISION_BRAND.accent,
      text: QC_DIVISION_BRAND.text,
      textSub: QC_DIVISION_BRAND.textSub,
      border: QC_DIVISION_BRAND.border,
      surface: QC_DIVISION_BRAND.surface,
      warn: QC_DIVISION_BRAND.warn,
    }),
    [],
  );

  return (
    <Box>
      <SchemaUI
        schema={schema}
        value={formValues}
        onChange={onChange}
        loading={loading}
        error={error}
        themeTokens={themeTokens}
        apiContext={{ subDepartmentId, batchId }}
      />
    </Box>
  );
};

export default QCSchemaPanel;
