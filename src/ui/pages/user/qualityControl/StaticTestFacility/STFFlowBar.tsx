import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";
import {
  STF_FLOW_LABELS,
  STF_MOTOR_TYPE_OPTIONS,
  canLoadStfForm,
} from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import type { StfSubType } from "../../../../../schema-engine";

type STFFlowBarProps = {
  selectedMotorType: StfSubType | "";
  motorIdNo: string;
  formLoaded: boolean;
  schemaLoading?: boolean;
  onMotorTypeChange: (value: string) => void;
  onMotorIdNoChange: (value: string) => void;
  onLoadForm: () => void;
  theme: any;
};

const STFFlowBar = ({
  selectedMotorType,
  motorIdNo,
  formLoaded,
  schemaLoading = false,
  onMotorTypeChange,
  onMotorIdNoChange,
  onLoadForm,
  theme,
}: STFFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = STF_FLOW_LABELS;
  const isMainMotor = selectedMotorType === "MAIN_MOTOR";
  const canLoad = canLoadStfForm(selectedMotorType, motorIdNo);

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
            label={L.motorType}
            value={selectedMotorType}
            placeholder={L.motorTypePlaceholder}
            options={STF_MOTOR_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            width={220}
            theme={theme}
            onChange={onMotorTypeChange}
          />

          {isMainMotor ? (
            <Box sx={flowBar.selectField?.(220)}>
              <Typography component="label" sx={flowBar.selectLabel}>
                {L.motorIdNo}
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={motorIdNo}
                placeholder={L.motorIdNoPlaceholder}
                onChange={(event) => onMotorIdNoChange(event.target.value)}
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

export default STFFlowBar;
