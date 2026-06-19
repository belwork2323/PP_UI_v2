import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import qcDivisionController from "../../../controllers/user/quality_control/qcDivisionController";
import { QCDivisionDetailsModel } from "../../../data/models/user/QCDivisionApiModel";
import {
  createDefaultQualityControlFormState,
  hasAnyQualityControlValue,
  hydrateQualityControlFormState,
  mapQualityControlDetailsToFormState,
  mapQualityControlPayload,
  type QualityControlFormState,
} from "../../../data/models/user/QualityControlFormModel";
import { createQcInitialValues, fetchQcSchema } from "../../../schema-engine/adapters/qc.adapter";
import type { QcApiDivision, QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import type { SchemaFormValues } from "../../../schema-engine";
import {
  getQcSchemaCacheKey,
  mergeQcMockBatches,
  resolveBatchFlowSelection,
  resolveQcSchemaSelection,
  resolveQcSchemaSelectionForSlot,
  type QCBatch,
} from "./qcFlowConfig";
import {
  isBothProcessingType,
  isPremixProcessingFlow,
  isRawMaterialRevalidationType,
  resolveActivePremixSlot,
  type QcProcessingSlot,
} from "./qcProcessingConfig";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";

type WorkflowView = "list" | "form";

const normalizeBatch = (batch: any): QCBatch => ({
  ...batch,
  qcStatus: batch?.qcStatus ?? batch?.qcDivStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.INITIATED,
  formId: batch?.formId ?? null,
  rejectionReason: batch?.rejectionReason ?? null,
});

const hasPremixEntries = (form: QualityControlFormState) =>
  (form.solidPremixEntries?.length ?? 0) > 0 || (form.liquidPremixEntries?.length ?? 0) > 0;

export const useQCDivisionHook = () => {
  const listParams = useSubdepartmentBatches("qc-division");
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const messages = STRINGS.QUALITY_CONTROL.QC_DIVISION;

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((subDept) => subDept.slugs?.subDept === "qc-division")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<QCBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<QualityControlFormState>(
    createDefaultQualityControlFormState(),
  );
  const [initialSnapshot, setInitialSnapshot] = useState(
    JSON.stringify({
      formData: createDefaultQualityControlFormState(),
      selectedDivision: "RAW_MATERIAL",
      selectedRawMaterialType: "",
      selectedProcessingType: "",
      selectedPremixSlot: "SOLID_PROCESSING",
      selectedPremix: "",
    }),
  );
  const [selectedDivision, setSelectedDivision] = useState("RAW_MATERIAL");
  const [selectedRawMaterialType, setSelectedRawMaterialType] = useState("");
  const [selectedProcessingType, setSelectedProcessingType] = useState("");
  const [selectedPremixSlot, setSelectedPremixSlot] = useState<QcProcessingSlot>("SOLID_PROCESSING");
  const [selectedPremix, setSelectedPremix] = useState<number | "">("");
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const batches = useMemo(
    () => mergeQcMockBatches((listParams.batches ?? []).map(normalizeBatch)),
    [listParams.batches],
  );

  const activePremixSlot = useMemo(
    () => resolveActivePremixSlot(selectedProcessingType, selectedPremixSlot),
    [selectedProcessingType, selectedPremixSlot],
  );

  const addedPremixNumbers = useMemo(() => {
    if (isBothProcessingType(selectedProcessingType)) {
      return (formData.solidPremixEntries ?? []).map((entry) => entry.premixNo);
    }

    const entries =
      activePremixSlot === "SOLID_PROCESSING"
        ? formData.solidPremixEntries ?? []
        : formData.liquidPremixEntries ?? [];
    return entries.map((entry) => entry.premixNo);
  }, [
    activePremixSlot,
    formData.liquidPremixEntries,
    formData.solidPremixEntries,
    selectedProcessingType,
  ]);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        selectedDivision,
        selectedRawMaterialType,
        selectedProcessingType,
        selectedPremixSlot,
        selectedPremix,
      }),
    [
      formData,
      selectedDivision,
      selectedPremix,
      selectedPremixSlot,
      selectedProcessingType,
      selectedRawMaterialType,
    ],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetProcessingFormState = () => ({
    schemaFormLoaded: false,
    division: null,
    subType: null,
    qcSchema: null,
    schemaFormValues: {},
    solidPremixEntries: [],
    solidPremixValuesByNo: {},
    liquidPremixEntries: [],
    liquidPremixValuesByNo: {},
  });

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultQualityControlFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(defaults);
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        selectedDivision: "RAW_MATERIAL",
        selectedRawMaterialType: "",
        selectedProcessingType: "",
        selectedPremixSlot: "SOLID_PROCESSING",
        selectedPremix: "",
      }),
    );
    setSelectedDivision("RAW_MATERIAL");
    setSelectedRawMaterialType("");
    setSelectedProcessingType("");
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchQcSchemaDocument = useCallback(
    async (division: QcApiDivision, subType: QcApiSubType) => {
      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const cacheKey = getQcSchemaCacheKey(division, subType);
      const cached = formData.schemasByKey?.[cacheKey];
      if (cached) return { schema: cached, division, subType };

      setSchemaLoading(true);
      setSchemaError(null);
      try {
        const response = await fetchQcSchema({
          subDepartmentId,
          division,
          subType,
        });
        if (!response?.success || !response?.data) {
          const message = getErrorMessage(response, messages.SCHEMA_FETCH_ERROR);
          setSchemaError(message);
          showAlert(message, "error");
          return null;
        }
        return { schema: response.data, division, subType };
      } finally {
        setSchemaLoading(false);
      }
    },
    [formData.schemasByKey, messages.SCHEMA_FETCH_ERROR, messages.SUB_DEPARTMENT_MISSING, showAlert, subDepartmentId],
  );

  const handleDivisionChange = useCallback((value: string) => {
    setSelectedDivision(value);
    setSelectedRawMaterialType("");
    setSelectedProcessingType("");
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setSchemaError(null);
    setFormData((prev) => ({
      ...prev,
      ...resetProcessingFormState(),
    }));
  }, []);

  const handleRawMaterialTypeChange = useCallback((value: string) => {
    setSelectedRawMaterialType(value);
    setSelectedProcessingType("");
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setSchemaError(null);
    setFormData((prev) => ({
      ...prev,
      ...resetProcessingFormState(),
    }));
  }, []);

  const handleProcessingTypeChange = useCallback((value: string) => {
    setSelectedProcessingType(value);
    setSelectedPremixSlot("SOLID_PROCESSING");
    setSelectedPremix("");
    setSchemaError(null);
    setFormData((prev) => ({
      ...prev,
      ...resetProcessingFormState(),
    }));
  }, []);

  const handlePremixSlotChange = useCallback((value: QcProcessingSlot) => {
    setSelectedPremixSlot(value);
    setSelectedPremix("");
  }, []);

  const handlePremixChange = useCallback((value: number | "") => {
    setSelectedPremix(value);
  }, []);

  const appendPremixEntry = useCallback(
    (
      prev: QualityControlFormState,
      hydrated: QualityControlFormState,
      slot: QcProcessingSlot,
      premixNo: number,
      schema: QualityControlFormState["qcSchema"],
    ): QualityControlFormState => {
      if (!schema) return hydrated;

      if (slot === "SOLID_PROCESSING") {
        return {
          ...hydrated,
          solidPremixEntries: [...(prev.solidPremixEntries ?? []), { premixNo }],
          solidPremixValuesByNo: {
            ...(prev.solidPremixValuesByNo ?? {}),
            [premixNo]: createQcInitialValues(schema),
          },
        };
      }

      return {
        ...hydrated,
        liquidPremixEntries: [...(prev.liquidPremixEntries ?? []), { premixNo }],
        liquidPremixValuesByNo: {
          ...(prev.liquidPremixValuesByNo ?? {}),
          [premixNo]: createQcInitialValues(schema),
        },
      };
    },
    [],
  );

  const handleLoadQcForm = useCallback(async () => {
    if (isPremixProcessingFlow(selectedRawMaterialType, selectedProcessingType)) {
      if (selectedPremix === "") return;

      const premixNo = Number(selectedPremix);

      if (isBothProcessingType(selectedProcessingType)) {
        if (formData.solidPremixEntries?.some((entry) => entry.premixNo === premixNo)) {
          showAlert(messages.PREMIX_ALREADY_ADDED, "warning");
          return;
        }

        const solidSelection = resolveQcSchemaSelectionForSlot("SOLID_PROCESSING");
        const liquidSelection = resolveQcSchemaSelectionForSlot("LIQUID_PROCESSING");
        const solidResult = await fetchQcSchemaDocument(solidSelection.division, solidSelection.subType);
        const liquidResult = await fetchQcSchemaDocument(liquidSelection.division, liquidSelection.subType);
        if (!solidResult || !liquidResult) return;

        setFormData((prev) => {
          const withSolid = hydrateQualityControlFormState(
            prev,
            solidResult.schema,
            solidResult.division,
            solidResult.subType,
          );
          const hydrated = hydrateQualityControlFormState(
            withSolid,
            liquidResult.schema,
            liquidResult.division,
            liquidResult.subType,
          );

          return {
            ...hydrated,
            solidPremixEntries: [...(prev.solidPremixEntries ?? []), { premixNo }],
            liquidPremixEntries: [...(prev.liquidPremixEntries ?? []), { premixNo }],
            solidPremixValuesByNo: {
              ...(prev.solidPremixValuesByNo ?? {}),
              [premixNo]: createQcInitialValues(solidResult.schema),
            },
            liquidPremixValuesByNo: {
              ...(prev.liquidPremixValuesByNo ?? {}),
              [premixNo]: createQcInitialValues(liquidResult.schema),
            },
          };
        });
        setSelectedPremix("");
        return;
      }

      const slot = activePremixSlot;
      const existingEntries =
        slot === "SOLID_PROCESSING" ? formData.solidPremixEntries : formData.liquidPremixEntries;

      if (existingEntries?.some((entry) => entry.premixNo === premixNo)) {
        showAlert(messages.PREMIX_ALREADY_ADDED, "warning");
        return;
      }

      const selection = resolveQcSchemaSelectionForSlot(slot);
      const result = await fetchQcSchemaDocument(selection.division, selection.subType);
      if (!result) return;

      setFormData((prev) => {
        const hydrated = hydrateQualityControlFormState(
          prev,
          result.schema,
          result.division,
          result.subType,
        );
        return appendPremixEntry(prev, hydrated, slot, premixNo, result.schema);
      });
      setSelectedPremix("");
      return;
    }

    const selection = resolveQcSchemaSelection(selectedDivision, selectedRawMaterialType, selectedProcessingType);
    if (!selection) return;

    const result = await fetchQcSchemaDocument(selection.division, selection.subType);
    if (!result) return;

    setFormData((prev) =>
      hydrateQualityControlFormState(prev, result.schema, result.division, result.subType),
    );
  }, [
    activePremixSlot,
    appendPremixEntry,
    fetchQcSchemaDocument,
    formData.liquidPremixEntries,
    formData.solidPremixEntries,
    messages.PREMIX_ALREADY_ADDED,
    selectedDivision,
    selectedPremix,
    selectedProcessingType,
    selectedRawMaterialType,
    showAlert,
  ]);

  const handlePremixValuesChange = useCallback(
    (slot: QcProcessingSlot, premixNo: number, values: SchemaFormValues) => {
      setFormData((prev) => {
        if (slot === "SOLID_PROCESSING") {
          return {
            ...prev,
            solidPremixValuesByNo: {
              ...(prev.solidPremixValuesByNo ?? {}),
              [premixNo]: values,
            },
          };
        }
        return {
          ...prev,
          liquidPremixValuesByNo: {
            ...(prev.liquidPremixValuesByNo ?? {}),
            [premixNo]: values,
          },
        };
      });
    },
    [],
  );

  const handleSolidPremixValuesChange = useCallback(
    (premixNo: number, values: SchemaFormValues) => {
      handlePremixValuesChange("SOLID_PROCESSING", premixNo, values);
    },
    [handlePremixValuesChange],
  );

  const handleLiquidPremixValuesChange = useCallback(
    (premixNo: number, values: SchemaFormValues) => {
      handlePremixValuesChange("LIQUID_PROCESSING", premixNo, values);
    },
    [handlePremixValuesChange],
  );

  const handleRemovePremix = useCallback((slot: QcProcessingSlot, premixNo: number) => {
    setFormData((prev) => {
      if (slot === "SOLID_PROCESSING") {
        const nextValues = { ...(prev.solidPremixValuesByNo ?? {}) };
        delete nextValues[premixNo];
        const nextEntries = (prev.solidPremixEntries ?? []).filter((entry) => entry.premixNo !== premixNo);
        const hasRemainingPremix = nextEntries.length > 0 || (prev.liquidPremixEntries?.length ?? 0) > 0;
        return {
          ...prev,
          solidPremixEntries: nextEntries,
          solidPremixValuesByNo: nextValues,
          schemaFormLoaded: hasRemainingPremix ? prev.schemaFormLoaded : false,
          qcSchema: hasRemainingPremix ? prev.qcSchema : null,
        };
      }

      const nextValues = { ...(prev.liquidPremixValuesByNo ?? {}) };
      delete nextValues[premixNo];
      const nextEntries = (prev.liquidPremixEntries ?? []).filter((entry) => entry.premixNo !== premixNo);
      const hasRemainingPremix = nextEntries.length > 0 || (prev.solidPremixEntries?.length ?? 0) > 0;
      return {
        ...prev,
        liquidPremixEntries: nextEntries,
        liquidPremixValuesByNo: nextValues,
        schemaFormLoaded: hasRemainingPremix ? prev.schemaFormLoaded : false,
        qcSchema: hasRemainingPremix ? prev.qcSchema : null,
      };
    });
  }, []);

  const handleRemoveCombinedPremix = useCallback((premixNo: number) => {
    setFormData((prev) => {
      const nextSolidValues = { ...(prev.solidPremixValuesByNo ?? {}) };
      const nextLiquidValues = { ...(prev.liquidPremixValuesByNo ?? {}) };
      delete nextSolidValues[premixNo];
      delete nextLiquidValues[premixNo];

      const nextSolidEntries = (prev.solidPremixEntries ?? []).filter((entry) => entry.premixNo !== premixNo);
      const nextLiquidEntries = (prev.liquidPremixEntries ?? []).filter((entry) => entry.premixNo !== premixNo);
      const hasRemainingPremix = nextSolidEntries.length > 0;

      return {
        ...prev,
        solidPremixEntries: nextSolidEntries,
        liquidPremixEntries: nextLiquidEntries,
        solidPremixValuesByNo: nextSolidValues,
        liquidPremixValuesByNo: nextLiquidValues,
        schemaFormLoaded: hasRemainingPremix ? prev.schemaFormLoaded : false,
        qcSchema: hasRemainingPremix ? prev.qcSchema : null,
      };
    });
  }, []);

  const handleRemoveSolidPremix = useCallback(
    (premixNo: number) => handleRemovePremix("SOLID_PROCESSING", premixNo),
    [handleRemovePremix],
  );

  const handleRemoveLiquidPremix = useCallback(
    (premixNo: number) => handleRemovePremix("LIQUID_PROCESSING", premixNo),
    [handleRemovePremix],
  );

  const handleFormValuesChange = useCallback((values: SchemaFormValues) => {
    setFormData((prev) => ({ ...prev, schemaFormValues: values }));
  }, []);

  const openFormWithResolvedData = useCallback(
    async (batch: QCBatch, editMode: boolean) => {
      const shouldFetchDetails =
        editMode ||
        batch.qcStatus === QUALITY_CONTROL_STATUS.IN_PROGRESS ||
        batch.qcStatus === QUALITY_CONTROL_STATUS.REJECTED;

      let resolvedData = createDefaultQualityControlFormState();
      let resolvedFormId = batch.formId ?? null;
      let rejectionReason = batch.rejectionReason ?? null;
      let initialDivision = "RAW_MATERIAL";
      const flowSelection = resolveBatchFlowSelection(batch.division, batch.subType);
      let initialRawMaterialType = flowSelection.rawMaterialType;
      let initialProcessingType = flowSelection.processingType;

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!resolvedFormId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        const detailsResponse = await qcDivisionController.fetchFormDetails({
          formId: resolvedFormId,
          subDepartmentId,
        });
        setLoadingFormDetails(false);

        if (!detailsResponse?.success || !detailsResponse.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? messages.DETAILS_NOT_FOUND
              : messages.DETAILS_FETCH_ERROR;
          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return;
        }

        resolvedData = QCDivisionDetailsModel.toFormState(detailsResponse.data);
        resolvedFormId = detailsResponse.data.formId || resolvedFormId;
        rejectionReason =
          detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;

        const resolvedFlow = resolveBatchFlowSelection(resolvedData.division, resolvedData.subType);
        initialRawMaterialType = resolvedFlow.rawMaterialType;
        initialProcessingType = resolvedFlow.processingType;
      }

      setActiveBatch({
        ...batch,
        formId: resolvedFormId,
        division: resolvedData.division,
        subType: resolvedData.subType,
        rejectionReason,
      });
      setSelectedDivision(initialDivision);
      setSelectedRawMaterialType(initialRawMaterialType);
      setSelectedProcessingType(initialProcessingType);
      setSelectedPremixSlot(
        initialProcessingType === "LIQUID_PROCESSING" ? "LIQUID_PROCESSING" : "SOLID_PROCESSING",
      );
      setFormData(resolvedData);
      setInitialSnapshot(
        JSON.stringify({
          formData: resolvedData,
          selectedDivision: initialDivision,
          selectedRawMaterialType: initialRawMaterialType,
          selectedProcessingType: initialProcessingType,
          selectedPremixSlot:
            initialProcessingType === "LIQUID_PROCESSING" ? "LIQUID_PROCESSING" : "SOLID_PROCESSING",
          selectedPremix: "",
        }),
      );
      setIsEditMode(editMode);
      setView("form");

      if (resolvedData.schemaFormLoaded && resolvedData.division) {
        const schemasToLoad: Array<{ division: QcApiDivision; subType: QcApiSubType }> = [];

        if (isRawMaterialRevalidationType(initialRawMaterialType)) {
          schemasToLoad.push({ division: "RAW_MATERIAL_REVALIDATION", subType: null });
        } else if (initialProcessingType === "SOLID_PROCESSING") {
          schemasToLoad.push({ division: "RAW_MATERIAL_PROCESSING", subType: "SOLID_PROCESSING" });
        } else if (initialProcessingType === "LIQUID_PROCESSING") {
          schemasToLoad.push({ division: "RAW_MATERIAL_PROCESSING", subType: "LIQUID_PROCESSING" });
        } else if (isBothProcessingType(initialProcessingType)) {
          schemasToLoad.push(
            { division: "RAW_MATERIAL_PROCESSING", subType: "SOLID_PROCESSING" },
            { division: "RAW_MATERIAL_PROCESSING", subType: "LIQUID_PROCESSING" },
          );
        }

        for (const schemaSelection of schemasToLoad) {
          const cacheKey = getQcSchemaCacheKey(schemaSelection.division, schemaSelection.subType);
          if (!resolvedData.schemasByKey?.[cacheKey]) {
            const result = await fetchQcSchemaDocument(schemaSelection.division, schemaSelection.subType);
            if (result) {
              setFormData((prev) =>
                hydrateQualityControlFormState(prev, result.schema, result.division, result.subType),
              );
            }
          }
        }
      }
    },
    [fetchQcSchemaDocument, messages, showAlert, subDepartmentId],
  );

  const handleFillForm = async (batch: QCBatch) => {
    await openFormWithResolvedData(batch, false);
  };

  const handleEditForm = async (batch: QCBatch) => {
    await openFormWithResolvedData(batch, true);
  };

  const handleBack = () => {
    if (view === "form" && isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }

    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  };

  const handleDiscardAndBack = () => {
    setBackConfirmOpen(false);
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  };

  const submitForm = async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (!formData.schemaFormLoaded || !hasAnyQualityControlValue(formData)) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    if (
      isPremixProcessingFlow(selectedRawMaterialType, selectedProcessingType) &&
      !hasPremixEntries(formData)
    ) {
      showAlert(messages.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const payload = mapQualityControlPayload(formData);
    const isCreateFlow =
      activeBatch.qcStatus === QUALITY_CONTROL_STATUS.INITIATED && !activeBatch.formId;

    setActionLoading(true);
    try {
      let response;

      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(messages.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await qcDivisionController.createForm({
          batchId: activeBatch.batchId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          ...payload,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(messages.FORM_ID_MISSING, "error");
          return false;
        }

        response = await qcDivisionController.updateForm({
          formId: activeBatch.formId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
          ...payload,
        });
      }

      if (!response?.success) {
        const fallback = isCreateFlow ? messages.CREATE_FAILED : messages.UPDATE_FAILED;
        showAlert(getErrorMessage(response, fallback), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) =>
        prev
          ? {
              ...prev,
              formId: nextFormId,
              division: formData.division,
              subType: formData.subType,
            }
          : prev,
      );
      setInitialSnapshot(formSnapshot);

      if (intent === "draft") {
        showAlert(
          isCreateFlow ? messages.CREATE_DRAFT_SUCCESS : messages.UPDATE_DRAFT_SUCCESS,
          "success",
          { autoCloseMs: 2200 },
        );
        setHasSavedDraft(true);
      } else {
        showAlert(
          isCreateFlow ? messages.CREATE_SUBMIT_SUCCESS : messages.UPDATE_SUBMIT_SUCCESS,
          "success",
          { autoCloseMs: 2200 },
        );
        await listParams.refreshUserBatches();
        resetFormContext();
      }

      return true;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraft = async () => submitForm("draft");
  const handleSubmit = async () => submitForm("submit");

  return {
    ...listParams,
    loading: listParams.loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    selectedDivision,
    selectedRawMaterialType,
    selectedProcessingType,
    selectedPremixSlot,
    selectedPremix,
    addedPremixNumbers,
    loadingFormDetails,
    schemaLoading,
    schemaError,
    actionLoading,
    backConfirmOpen,
    batches,
    subDepartmentId,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleDivisionChange,
    handleRawMaterialTypeChange,
    handleProcessingTypeChange,
    handlePremixSlotChange,
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
  };
};

export default useQCDivisionHook;
