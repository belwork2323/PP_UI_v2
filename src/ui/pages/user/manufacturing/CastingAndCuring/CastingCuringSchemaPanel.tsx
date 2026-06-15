import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createCastingCuringInitialValues,
  hydrateCastingCuringValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
  type SchemaSetupContext,
} from "../../../../../schema-engine";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";

type CastingCuringSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  projectId?: string;
  motorId?: string;
  setupContext?: SchemaSetupContext;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
  readOnly?: boolean;
};

const CastingCuringSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  subDepartmentId,
  batchId,
  projectId,
  motorId,
  setupContext,
  onChange,
  loading = false,
  error = null,
  readOnly = false,
}: CastingCuringSchemaPanelProps) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [savedSections, schema?.schemaVersion]);

  useEffect(() => {
    if (!schema) return;
    if (hydratedRef.current) return;

    if (savedSections?.length) {
      onChange(hydrateCastingCuringValuesFromSections(schema, savedSections, setupContext));
    } else if (Object.keys(formValues ?? {}).length === 0) {
      onChange(createCastingCuringInitialValues(schema, setupContext));
    }
    hydratedRef.current = true;
  }, [schema, savedSections, setupContext]);

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
        readOnly={readOnly}
        themeTokens={themeTokens}
        apiContext={{ subDepartmentId, batchId, projectId, motorId }}
        setupContext={setupContext}
        batch={{ batchId, projectId }}
        motorId={motorId}
      />
    </Box>
  );
};

export default CastingCuringSchemaPanel;
