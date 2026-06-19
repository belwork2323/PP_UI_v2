import React, { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import QCDivisionList from "./QCDivisionList";
import QCForm from "./QCForm";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import useQCDivisionHook from "../../../../../hooks/user/qualityControl/useQCDivisionHook";

const QualityControlPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const flowBarTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.QC_DIVISION;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const hookState = useQCDivisionHook();
  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    selectedDivision,
    selectedRawMaterialType,
    selectedProcessingType,
    selectedPremix,
    addedPremixNumbers,
    loadingFormDetails,
    schemaLoading,
    schemaError,
    actionLoading,
    backConfirmOpen,
    subDepartmentId,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    handleDivisionChange,
    handleRawMaterialTypeChange,
    handleProcessingTypeChange,
    handlePremixChange,
    handleLoadQcForm,
    handleFormValuesChange,
    handleSolidPremixValuesChange,
    handleLiquidPremixValuesChange,
    handleRemoveSolidPremix,
    handleRemoveLiquidPremix,
    handleRemoveCombinedPremix,
    handleSaveDraft,
    handleSubmit,
  } = hookState;

  const canAct =
    formData.schemaFormLoaded ||
    (formData.solidPremixEntries?.length ?? 0) > 0 ||
    (formData.liquidPremixEntries?.length ?? 0) > 0;

  if (loading) {
    return (
      <Box sx={theme.workflow.loadingContainer}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (view === "list") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <QCDivisionList hookState={hookState} />
      </Box>
    );
  }

  return (
    <Box sx={theme.workflow.animatedContainer}>
      {activeBatch ? (
        <>
          <UserWorkflowFormHeader
            batch={activeBatch}
            isEdit={isEditMode}
            onBack={handleBack}
            newLabel={strings.NEW_LABEL}
            backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST}
            editLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.EDITING_REJECTED}
            rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON}
            theme={theme}
          />

          {!loadingFormDetails ? (
            <QCForm
              batch={activeBatch}
              formData={formData}
              subDepartmentId={subDepartmentId}
              selectedDivision={selectedDivision}
              selectedRawMaterialType={selectedRawMaterialType}
              selectedProcessingType={selectedProcessingType}
              selectedPremix={selectedPremix}
              addedPremixNumbers={addedPremixNumbers}
              isEditMode={isEditMode}
              schemaLoading={schemaLoading}
              schemaError={schemaError}
              flowBarTheme={flowBarTheme}
              onDivisionChange={handleDivisionChange}
              onRawMaterialTypeChange={handleRawMaterialTypeChange}
              onProcessingTypeChange={handleProcessingTypeChange}
              onPremixChange={handlePremixChange}
              onLoadForm={handleLoadQcForm}
              onFormValuesChange={handleFormValuesChange}
              onSolidPremixValuesChange={handleSolidPremixValuesChange}
              onLiquidPremixValuesChange={handleLiquidPremixValuesChange}
              onRemoveSolidPremix={handleRemoveSolidPremix}
              onRemoveLiquidPremix={handleRemoveLiquidPremix}
              onRemoveCombinedPremix={handleRemoveCombinedPremix}
              theme={theme}
            />
          ) : null}

          {!loadingFormDetails ? (
            <>
              <Box
                sx={{
                  mt: 2,
                  p: "12px 16px",
                  borderRadius: 2,
                  background: "#fff",
                  border: "1.5px solid #D5D8DC",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                  gap={1.5}
                >
                  <Box>
                    <Box component="span" sx={{ fontSize: "0.76rem", fontWeight: 700, color: "#1C2833" }}>
                      {canAct ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
                    </Box>
                  </Box>
                  <Stack direction="row" gap={1}>
                    <Button
                      variant="outlined"
                      disabled={!canAct || actionLoading}
                      onClick={() => setDraftConfirmOpen(true)}
                    >
                      {strings.SAVE_DRAFT_LABEL}
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!canAct || actionLoading}
                      onClick={() => setSubmitConfirmOpen(true)}
                    >
                      {isEditMode ? strings.RESUBMIT_LABEL : strings.SUBMIT_LABEL}
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              <ConfirmAlertDialog
                open={draftConfirmOpen}
                severity="info"
                title={strings.DRAFT_CONFIRM_TITLE}
                message={strings.DRAFT_CONFIRM_MESSAGE}
                confirmLabel={strings.DRAFT_CONFIRM_LABEL}
                cancelLabel={strings.CONFIRM_CANCEL_LABEL}
                onConfirm={async () => {
                  setDraftConfirmOpen(false);
                  await handleSaveDraft();
                }}
                onCancel={() => setDraftConfirmOpen(false)}
              />
              <ConfirmAlertDialog
                open={submitConfirmOpen}
                severity="warning"
                title={isEditMode ? strings.RESUBMIT_CONFIRM_TITLE : strings.SUBMIT_CONFIRM_TITLE}
                message={isEditMode ? strings.RESUBMIT_CONFIRM_MESSAGE : strings.SUBMIT_CONFIRM_MESSAGE}
                confirmLabel={isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL}
                cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
                onConfirm={async () => {
                  setSubmitConfirmOpen(false);
                  await handleSubmit();
                }}
                onCancel={() => setSubmitConfirmOpen(false)}
              />
            </>
          ) : null}
        </>
      ) : null}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={strings.UNSAVED_BACK_TITLE}
        message={strings.UNSAVED_BACK_MESSAGE}
        confirmLabel={strings.UNSAVED_BACK_DISCARD}
        cancelLabel={strings.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </Box>
  );
};

export default QualityControlPage;
