import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createCastingCuringInitialValues,
  hydrateCastingCuringValuesFromSections,
  type SchemaDocument,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schemaManagement";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";

type CastingCuringSchemaPanelProps = {
  schema: SchemaDocument | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
};

const CastingCuringSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  subDepartmentId,
  batchId,
  onChange,
  loading = false,
  error = null,
}: CastingCuringSchemaPanelProps) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [savedSections, schema?.schemaVersion]);

  useEffect(() => {
    if (!schema) return;
    if (hydratedRef.current) return;

    if (savedSections?.length) {
      onChange(hydrateCastingCuringValuesFromSections(schema, savedSections));
    } else if (Object.keys(formValues ?? {}).length === 0) {
      onChange(createCastingCuringInitialValues(schema));
    }
    hydratedRef.current = true;
  }, [schema, savedSections]);

  const themeTokens = useMemo(
    () => ({
      primary: CASTING_CURING_BRAND.cc,
      primaryLight: CASTING_CURING_BRAND.ccLight,
      accent: CASTING_CURING_BRAND.accent,
      text: CASTING_CURING_BRAND.text,
      textSub: CASTING_CURING_BRAND.textSub,
      border: CASTING_CURING_BRAND.border,
      surface: CASTING_CURING_BRAND.surface,
      warn: CASTING_CURING_BRAND.warn,
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

export default CastingCuringSchemaPanel;
