import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import CasePrepSelect from "../manufacturing/CasePreparation/CasePrepSelect";
import CasePrepDateField from "../manufacturing/CasePreparation/CasePrepDateField";
import {
  DISPATCH_FLOW_LABELS,
  DISPATCH_STAGE_OPTIONS,
  DISPATCH_YES_NO_OPTIONS,
  canLoadDispatchForm,
  getDispatchMotorOptions,
} from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import type { DispatchFormState } from "../../../../data/models/user/DispatchFormModel";

type DispatchFlowBarProps = {
  batchId?: string;
  formData: DispatchFormState;
  formLoaded: boolean;
  schemaLoading?: boolean;
  onSetupChange: <K extends keyof DispatchFormState>(
    field: K,
    value: DispatchFormState[K],
  ) => void;
  onLoadForm: () => void;
  theme: any;
};

const DispatchFlowBar = ({
  batchId,
  formData,
  formLoaded,
  schemaLoading = false,
  onSetupChange,
  onLoadForm,
  theme,
}: DispatchFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = DISPATCH_FLOW_LABELS;
  const motorOptions = getDispatchMotorOptions(batchId, formData.motorStage);
  const canLoad = canLoadDispatchForm(formData);

  return (
    <Box sx={flowBar.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            ...flowBar.topRow,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <CasePrepSelect
            label={L.stage}
            value={formData.motorStage}
            placeholder={L.stagePlaceholder}
            options={DISPATCH_STAGE_OPTIONS}
            width={180}
            theme={theme}
            onChange={(value) => onSetupChange("motorStage", value)}
          />

          <CasePrepSelect
            label={L.motorId}
            value={formData.motorId}
            placeholder={L.motorIdPlaceholder}
            options={motorOptions}
            width={220}
            theme={theme}
            disabled={!formData.motorStage}
            onChange={(value) => onSetupChange("motorId", value)}
          />

          <CasePrepDateField
            label={L.castingDate}
            value={formData.castingDate}
            onChange={(value) => onSetupChange("castingDate", value)}
            theme={theme}
          />

          <CasePrepDateField
            label={L.dispatchDate}
            value={formData.dispatchDate}
            onChange={(value) => onSetupChange("dispatchDate", value)}
            theme={theme}
          />

          <Box sx={flowBar.selectField?.(240)}>
            <Typography component="label" sx={flowBar.selectLabel}>
              {L.dispatchLocation}
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={formData.dispatchLocation}
              placeholder={L.dispatchLocationPlaceholder}
              onChange={(event) => onSetupChange("dispatchLocation", event.target.value)}
              sx={flowBar.textField}
            />
          </Box>
        </Box>

        <Box
          sx={{
            ...flowBar.topRow,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <CasePrepSelect
            label={L.ndtClearance}
            value={formData.ndtClearance}
            placeholder="Select"
            options={DISPATCH_YES_NO_OPTIONS}
            width={260}
            theme={theme}
            onChange={(value) => onSetupChange("ndtClearance", value)}
          />

          {formData.ndtClearance === "YES" ? (
            <Box sx={flowBar.selectField?.(220)}>
              <Typography component="label" sx={flowBar.selectLabel}>
                {L.ndtMomNo}
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={formData.ndtMomNo}
                placeholder={L.ndtMomNoPlaceholder}
                onChange={(event) => onSetupChange("ndtMomNo", event.target.value)}
                sx={flowBar.textField}
              />
            </Box>
          ) : null}

          <CasePrepSelect
            label={L.finalAcceptanceClearance}
            value={formData.finalAcceptanceClearance}
            placeholder="Select"
            options={DISPATCH_YES_NO_OPTIONS}
            width={340}
            theme={theme}
            onChange={(value) => onSetupChange("finalAcceptanceClearance", value)}
          />

          {formData.finalAcceptanceClearance === "YES" ? (
            <Box sx={flowBar.selectField?.(220)}>
              <Typography component="label" sx={flowBar.selectLabel}>
                {L.finalAcceptanceMomNo}
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={formData.finalAcceptanceMomNo}
                placeholder={L.finalAcceptanceMomNoPlaceholder}
                onChange={(event) => onSetupChange("finalAcceptanceMomNo", event.target.value)}
                sx={flowBar.textField}
              />
            </Box>
          ) : null}

          <Button
            variant="contained"
            disabled={!canLoad || schemaLoading || formLoaded}
            onClick={onLoadForm}
            sx={flowBar.loadButton}
          >
            {schemaLoading ? (
              <>
                <CircularProgress size={16} sx={{ color: "#fff", mr: 1 }} />
                {L.loadingSchema}
              </>
            ) : (
              L.loadForm
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DispatchFlowBar;
