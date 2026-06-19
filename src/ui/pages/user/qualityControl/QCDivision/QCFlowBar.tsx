import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";
import {
  QC_DIVISION_OPTIONS,
  QC_FLOW_LABELS,
  QC_PROCESSING_TYPE_OPTIONS,
  QC_RAW_MATERIAL_TYPE_OPTIONS,
  canLoadQcForm,
} from "../../../../../hooks/user/qualityControl/qcFlowConfig";
import {
  QC_PROCESSING_PREMIX_OPTIONS,
  getQcPremixLabel,
  isPremixProcessingFlow,
  isRawMaterialProcessingType,
} from "../../../../../hooks/user/qualityControl/qcProcessingConfig";
import { STRINGS } from "../../../../../app/config/strings";
import { Box, Button, CircularProgress } from "@mui/material";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type QCFlowBarProps = {
  selectedDivision: string;
  selectedRawMaterialType: string;
  selectedProcessingType: string;
  selectedPremix: number | "";
  addedPremixNumbers: number[];
  formLoaded: boolean;
  schemaLoading?: boolean;
  onDivisionChange: (value: string) => void;
  onRawMaterialTypeChange: (value: string) => void;
  onProcessingTypeChange: (value: string) => void;
  onPremixChange: (value: number | "") => void;
  onLoadForm: () => void;
  theme: any;
};

const QCFlowBar = ({
  selectedDivision,
  selectedRawMaterialType,
  selectedProcessingType,
  selectedPremix,
  addedPremixNumbers,
  formLoaded,
  schemaLoading = false,
  onDivisionChange,
  onRawMaterialTypeChange,
  onProcessingTypeChange,
  onPremixChange,
  onLoadForm,
  theme,
}: QCFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = QC_FLOW_LABELS;
  const showRawMaterialType = selectedDivision === "RAW_MATERIAL";
  const showProcessingType = showRawMaterialType && isRawMaterialProcessingType(selectedRawMaterialType);
  const isPremixFlow = isPremixProcessingFlow(selectedRawMaterialType, selectedProcessingType);
  const canLoad = canLoadQcForm(selectedDivision, selectedRawMaterialType, selectedProcessingType, {
    selectedPremix,
    addedPremixNumbers,
  });
  const premixAlreadyAdded =
    selectedPremix !== "" && addedPremixNumbers.includes(Number(selectedPremix));

  const availablePremixOptions = QC_PROCESSING_PREMIX_OPTIONS.filter(
    (premixNo) => !addedPremixNumbers.includes(premixNo),
  );

  const showLoadAction =
    showRawMaterialType &&
    selectedRawMaterialType &&
    (!showProcessingType || selectedProcessingType);

  return (
    <Box sx={flowBar.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ ...flowBar.topRow, alignItems: "flex-end", flexWrap: "wrap" }}>
          <CasePrepSelect
            label={L.division}
            value={selectedDivision}
            placeholder={L.divisionPlaceholder}
            options={QC_DIVISION_OPTIONS.map((option) => ({
              value: option.value,
              label: option.enabled === false ? `${option.label} (Coming soon)` : option.label,
              disabled: option.enabled === false,
            }))}
            width={240}
            theme={theme}
            onChange={onDivisionChange}
          />

          {showRawMaterialType ? (
            <CasePrepSelect
              label={L.rawMaterialType}
              value={selectedRawMaterialType}
              placeholder={L.rawMaterialTypePlaceholder}
              options={QC_RAW_MATERIAL_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              width={280}
              theme={theme}
              onChange={onRawMaterialTypeChange}
            />
          ) : null}

          {showProcessingType ? (
            <CasePrepSelect
              label={L.processingType}
              value={selectedProcessingType}
              placeholder={L.processingTypePlaceholder}
              options={QC_PROCESSING_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              width={240}
              theme={theme}
              onChange={onProcessingTypeChange}
            />
          ) : null}

          {isPremixFlow ? (
            <CasePrepSelect
              label={S.PREMIX_LABEL}
              value={selectedPremix === "" ? "" : String(selectedPremix)}
              placeholder={S.PREMIX_PLACEHOLDER}
              options={availablePremixOptions.map((premixNo) => ({
                value: String(premixNo),
                label: getQcPremixLabel(premixNo),
              }))}
              width={260}
              theme={theme}
              onChange={(value) => onPremixChange(value === "" ? "" : Number(value))}
            />
          ) : null}
        </Box>

        {showLoadAction ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="small"
              disabled={
                !canLoad ||
                schemaLoading ||
                premixAlreadyAdded ||
                (!isPremixFlow && formLoaded)
              }
              onClick={onLoadForm}
              startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {schemaLoading
                ? L.loadingSchema
                : isPremixFlow
                  ? S.ADD_PREMIX_LABEL
                  : L.loadForm}
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default QCFlowBar;
