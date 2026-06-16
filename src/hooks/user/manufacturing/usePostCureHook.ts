import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import postCureController from "../../../controllers/user/manufacturing/postCureController";
import {
  createDefaultPostCureFormState,
  hasAnyPostCureValue,
  hydratePostCureFormWithSchema,
  mapPostCureDetailsToFormState,
  mapPostCureFormStateToPayload,
  type PostCureFormState,
} from "../../../data/models/user/PostCureFormModel";
import {
  buildPostCureSchemaRequest,
  postCureSchemaFetchConfig,
  schemaEngineController,
  type SchemaFormValues,
} from "../../../schema-engine";
import {
  canLoadPostCureForm,
  mapPostCureInhibitorTypeToApi,
  mapPostCureOperationToApi,
} from "./postCureConfig";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form";

type PostCureBatch = {
  batchId: string;
  pcStatus?: string;
  formId?: string | null;
  [key: string]: any;
};

const PC_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

export const usePostCureHook = () => {
  const listParams = useSubdepartmentBatches("post-cure-operations");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "post-cure-operations")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<PostCureBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<PostCureFormState>(createDefaultPostCureFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultPostCureFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify(defaults));
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchPostCureSchema = useCallback(
    async (setup: Pick<PostCureFormState, "operation" | "inhibitorType">) => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const operationType = mapPostCureOperationToApi(setup.operation);
      if (!operationType) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.OPERATION_MISSING, "warning");
        return null;
      }

      const inhibitorType = mapPostCureInhibitorTypeToApi(setup.inhibitorType);
      const request = buildPostCureSchemaRequest({
        subDepartmentId,
        operationType,
        ...(operationType === "INHIBITION" && inhibitorType ? { inhibitorType } : {}),
      });

      setSchemaLoading(true);
      setSchemaError(null);
      try {
        const response = await schemaEngineController.fetchSchema(postCureSchemaFetchConfig, request);
        if (!response?.success || !response?.data) {
          const message = getErrorMessage(response, STRINGS.MANUFACTURING.POST_CURE.SCHEMA_FETCH_ERROR);
          setSchemaError(message);
          showAlert(message, "error");
          return null;
        }
        return response.data;
      } finally {
        setSchemaLoading(false);
      }
    },
    [showAlert, subDepartmentId],
  );

  const openFormWithResolvedData = useCallback(
    async (batch: PostCureBatch, editMode: boolean) => {
      const status = parseStatus(batch.pcStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(PC_STATUS.IN_PROGRESS) ||
        status === parseStatus(PC_STATUS.REJECTED);

      let nextBatch = batch;
      let nextFormData = createDefaultPostCureFormState();

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(STRINGS.MANUFACTURING.POST_CURE.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!batch.formId) {
          showAlert(STRINGS.MANUFACTURING.POST_CURE.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        const detailsResponse = await postCureController.fetchFormDetails({
          formId: batch.formId,
          subDepartmentId,
        });
        setLoadingFormDetails(false);

        if (!detailsResponse?.success || !detailsResponse?.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? STRINGS.MANUFACTURING.POST_CURE.DETAILS_NOT_FOUND
              : STRINGS.MANUFACTURING.POST_CURE.DETAILS_FETCH_ERROR;
          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return;
        }

        nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
        nextFormData = mapPostCureDetailsToFormState(detailsResponse.data);

        if (nextFormData.schemaFormLoaded || nextFormData.savedSections?.length) {
          const schema = await fetchPostCureSchema(nextFormData);
          if (schema) {
            nextFormData = hydratePostCureFormWithSchema(nextFormData, schema);
          }
        }
      }

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setInitialSnapshot(JSON.stringify(nextFormData));
      setView("form");
    },
    [showAlert, subDepartmentId, fetchPostCureSchema],
  );

  const handleFillForm = useCallback(
    async (batch: PostCureBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: PostCureBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
  );

  const handleBack = useCallback(() => {
    if (isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [isFormDirty, resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleDiscardAndBack = useCallback(() => {
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleFormChange = useCallback((payload: PostCureFormState) => {
    setFormData(payload ?? createDefaultPostCureFormState());
  }, []);

  const handleSchemaValuesChange = useCallback((values: SchemaFormValues) => {
    setFormData((prev) => ({ ...prev, schemaFormValues: values }));
  }, []);

  const handleLoadForm = useCallback(async () => {
    if (
      !canLoadPostCureForm({
        motorId: formData.motorId,
        motorReceiptDate: formData.motorReceiptDate,
        operation: formData.operation,
        inhibitorType: formData.inhibitorType,
        schemaFormLoaded: formData.schemaFormLoaded,
      })
    ) {
      return;
    }

    const schema = await fetchPostCureSchema(formData);
    if (!schema) return;

    const nextFormData = hydratePostCureFormWithSchema(formData, schema);
    setFormData(nextFormData);
    setSchemaError(null);
  }, [formData, fetchPostCureSchema]);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!formData.schemaFormLoaded || !formData.postCureSchema) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.SCHEMA_NOT_LOADED, "warning");
        return false;
      }

      if (!hasAnyPostCureValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const status = parseStatus(activeBatch.pcStatus);
      const isCreateFlow = status === parseStatus(PC_STATUS.INITIATED) && !activeBatch.formId;
      const payloadBody = mapPostCureFormStateToPayload(formData, formData.postCureSchema);

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await postCureController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.FORM_ID_MISSING, "error");
            return false;
          }
          response = await postCureController.updateForm({
            formId: activeBatch.formId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.POST_CURE.CREATE_FAILED
            : STRINGS.MANUFACTURING.POST_CURE.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.POST_CURE.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.POST_CURE.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.POST_CURE.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.POST_CURE.UPDATE_SUBMIT_SUCCESS,
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
    },
    [activeBatch, subDepartmentId, formData, formSnapshot, showAlert, listParams, resetFormContext],
  );

  const handleSaveDraft = useCallback(async () => {
    return await submitForm("draft");
  }, [submitForm]);

  const handleSubmit = useCallback(async () => {
    return await submitForm("submit");
  }, [submitForm]);

  const canLoadForm = useMemo(
    () =>
      canLoadPostCureForm({
        motorId: formData.motorId,
        motorReceiptDate: formData.motorReceiptDate,
        operation: formData.operation,
        inhibitorType: formData.inhibitorType,
        schemaFormLoaded: formData.schemaFormLoaded,
      }),
    [formData],
  );

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    actionLoading,
    schemaLoading,
    schemaError,
    canLoadForm,
    subDepartmentId,
    backConfirmOpen,
    setBackConfirmOpen,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleFormChange,
    handleSchemaValuesChange,
    handleLoadForm,
    handleSaveDraft,
    handleSubmit,
  };
};

export default usePostCureHook;
