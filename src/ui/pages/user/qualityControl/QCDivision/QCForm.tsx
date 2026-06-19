import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import { getProcessingSchemaFromFormState } from "../../../../../data/models/user/QualityControlFormModel";
import { resolveFlowTypeLabel } from "../../../../../hooks/user/qualityControl/qcFlowConfig";
import {
  isBothProcessingType,
  isLiquidProcessingSubType,
  isPremixProcessingFlow,
  isRawMaterialRevalidationType,
  isSolidProcessingSubType,
} from "../../../../../hooks/user/qualityControl/qcProcessingConfig";
import QCBothProcessingPremixPanel from "./QCBothProcessingPremixPanel";
import QCFlowBar from "./QCFlowBar";
import QCProcessingPremixPanel from "./QCProcessingPremixPanel";
import QCSchemaPanel from "./QCSchemaPanel";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const { science: ScienceRoundedIcon } = icons.user.qualityControl.qcDivision.form;

type QCFormProps = {
  batch?: { batchId?: string } | null;
  formData: QualityControlFormState;
  subDepartmentId?: number;
  selectedDivision: string;
  selectedRawMaterialType: string;
  selectedProcessingType: string;
  selectedPremix: number | "";
  addedPremixNumbers: number[];
  isEditMode?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  flowBarTheme: any;
  onDivisionChange: (value: string) => void;
  onRawMaterialTypeChange: (value: string) => void;
  onProcessingTypeChange: (value: string) => void;
  onPremixChange: (value: number | "") => void;
  onLoadForm: () => void;
  onFormValuesChange: (values: import("../../../../../schema-engine").SchemaFormValues) => void;
  onSolidPremixValuesChange: (premixNo: number, values: import("../../../../../schema-engine").SchemaFormValues) => void;
  onLiquidPremixValuesChange: (premixNo: number, values: import("../../../../../schema-engine").SchemaFormValues) => void;
  onRemoveSolidPremix: (premixNo: number) => void;
  onRemoveLiquidPremix: (premixNo: number) => void;
  onRemoveCombinedPremix: (premixNo: number) => void;
  theme: any;
};

const QCForm = ({
  batch,
  formData,
  subDepartmentId,
  selectedDivision,
  selectedRawMaterialType,
  selectedProcessingType,
  selectedPremix,
  addedPremixNumbers,
  isEditMode = false,
  schemaLoading = false,
  schemaError = null,
  flowBarTheme,
  onDivisionChange,
  onRawMaterialTypeChange,
  onProcessingTypeChange,
  onPremixChange,
  onLoadForm,
  onFormValuesChange,
  onSolidPremixValuesChange,
  onLiquidPremixValuesChange,
  onRemoveSolidPremix,
  onRemoveLiquidPremix,
  onRemoveCombinedPremix,
  theme,
}: QCFormProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const isPremixFlow = isPremixProcessingFlow(selectedRawMaterialType, selectedProcessingType);
  const isBoth = isBothProcessingType(selectedProcessingType);
  const showSolidOnly = isPremixFlow && isSolidProcessingSubType(selectedProcessingType);
  const showLiquidOnly = isPremixFlow && isLiquidProcessingSubType(selectedProcessingType);
  const isRevalidation = isRawMaterialRevalidationType(selectedRawMaterialType);
  const isReady = isPremixFlow
    ? (formData.solidPremixEntries?.length ?? 0) > 0 || (formData.liquidPremixEntries?.length ?? 0) > 0
    : formData.schemaFormLoaded && Boolean(formData.qcSchema);
  const subTypeLabel = resolveFlowTypeLabel(selectedRawMaterialType, selectedProcessingType);
  const solidSchema = getProcessingSchemaFromFormState(formData, "SOLID_PROCESSING");
  const liquidSchema = getProcessingSchemaFromFormState(formData, "LIQUID_PROCESSING");

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 2.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: "rgba(192,57,43,0.05)",
            border: "1.5px solid rgba(192,57,43,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.danger, fontWeight: 600 }}>
            {S.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.border}`,
          background: `linear-gradient(135deg, ${BRAND.surface} 0%, #fff 100%)`,
          px: 2,
          py: 1.75,
          mb: 2.5,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: `linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${BRAND.primary}40`,
              }}
            >
              <ScienceRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BRAND.text }}>
                {S.TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.2 }}>
                {S.SUBTITLE}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>
          {subTypeLabel ? (
            <Chip
              label={subTypeLabel}
              size="small"
              sx={{
                height: 26,
                fontWeight: 700,
                fontSize: "0.7rem",
                alignSelf: { xs: "flex-start", sm: "center" },
                background: "rgba(27,79,114,0.1)",
                color: BRAND.primary,
                border: `1px solid ${BRAND.primary}44`,
              }}
            />
          ) : null}
        </Stack>
      </Box>

      <QCFlowBar
        selectedDivision={selectedDivision}
        selectedRawMaterialType={selectedRawMaterialType}
        selectedProcessingType={selectedProcessingType}
        selectedPremix={selectedPremix}
        addedPremixNumbers={addedPremixNumbers}
        formLoaded={Boolean(isReady)}
        schemaLoading={schemaLoading}
        onDivisionChange={onDivisionChange}
        onRawMaterialTypeChange={onRawMaterialTypeChange}
        onProcessingTypeChange={onProcessingTypeChange}
        onPremixChange={onPremixChange}
        onLoadForm={onLoadForm}
        theme={flowBarTheme}
      />

      {schemaLoading && !formData.qcSchema && !solidSchema && !liquidSchema ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 2,
            py: 5,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {isBoth ? (
        <Box sx={{ mt: 2 }}>
          <QCBothProcessingPremixPanel
            solidSchema={solidSchema}
            liquidSchema={liquidSchema}
            premixEntries={formData.solidPremixEntries ?? []}
            solidPremixValuesByNo={formData.solidPremixValuesByNo ?? {}}
            liquidPremixValuesByNo={formData.liquidPremixValuesByNo ?? {}}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            onSolidPremixValuesChange={onSolidPremixValuesChange}
            onLiquidPremixValuesChange={onLiquidPremixValuesChange}
            onRemovePremix={onRemoveCombinedPremix}
          />
        </Box>
      ) : null}

      {showSolidOnly ? (
        <Box sx={{ mt: 2 }}>
          <QCProcessingPremixPanel
            schema={solidSchema}
            premixEntries={formData.solidPremixEntries ?? []}
            premixValuesByNo={formData.solidPremixValuesByNo ?? {}}
            slotKey="solid"
            copy={{
              sectionTitle: S.SOLID_SECTION_TITLE,
              noPremixMessage: S.SOLID_NO_PREMIX_MESSAGE,
              navTitle: S.SOLID_PREMIX_NAV_TITLE,
              navHint: S.SOLID_PREMIX_NAV_HINT,
              navBack: S.SOLID_PREMIX_NAV_BACK,
              navNext: S.SOLID_PREMIX_NAV_NEXT,
              counter: S.SOLID_PREMIX_COUNTER,
              removeTooltip: S.SOLID_REMOVE_PREMIX_TOOLTIP,
            }}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            onPremixValuesChange={onSolidPremixValuesChange}
            onRemovePremix={onRemoveSolidPremix}
          />
        </Box>
      ) : null}

      {showLiquidOnly ? (
        <Box sx={{ mt: 2 }}>
          <QCProcessingPremixPanel
            schema={liquidSchema}
            premixEntries={formData.liquidPremixEntries ?? []}
            premixValuesByNo={formData.liquidPremixValuesByNo ?? {}}
            slotKey="liquid"
            copy={{
              sectionTitle: S.LIQUID_SECTION_TITLE,
              noPremixMessage: S.LIQUID_NO_PREMIX_MESSAGE,
              navTitle: S.LIQUID_PREMIX_NAV_TITLE,
              navHint: S.LIQUID_PREMIX_NAV_HINT,
              navBack: S.LIQUID_PREMIX_NAV_BACK,
              navNext: S.LIQUID_PREMIX_NAV_NEXT,
              counter: S.LIQUID_PREMIX_COUNTER,
              removeTooltip: S.LIQUID_REMOVE_PREMIX_TOOLTIP,
            }}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            onPremixValuesChange={onLiquidPremixValuesChange}
            onRemovePremix={onRemoveLiquidPremix}
          />
        </Box>
      ) : null}

      {isRevalidation && isReady ? (
        <Box sx={{ mt: 2 }}>
          <QCSchemaPanel
            schema={formData.qcSchema}
            formValues={formData.schemaFormValues}
            savedSections={formData.savedSections}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            onChange={onFormValuesChange}
            loading={schemaLoading}
            error={schemaError}
          />
        </Box>
      ) : null}
    </Box>
  );
};

export default QCForm;
