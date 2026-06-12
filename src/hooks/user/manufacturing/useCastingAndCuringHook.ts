import { useCallback, useEffect, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import castingCuringController from "../../../controllers/user/manufacturing/castingCuringController";
import {
  createDefaultCastingCuringFormState,
  createEmptyMotorSession,
  hasAnyCastingCuringValue,
  hydrateCastingCuringFormState,
  mapCastingCuringDetailsToFormState,
  mapCastingCuringFormStateToPayload,
  type CastingCuringFormState,
  type CastingCuringMotorSession,
} from "../../../data/models/user/CastingCuringFormModel";
import {
  buildCastingCuringSchemaRequest,
  castingCuringCastingSchemaFetchConfig,
  castingCuringCuringSchemaFetchConfig,
  createCastingCuringInitialValues,
} from "../../../schemaManagement";
import schemaManagementController from "../../../schemaManagement/controllers/schemaManagementController";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import {
  getSelectedCastingDraftMotorIds,
  resolveCastingCuringMotorOptions,
  resolveCastingMotorCount,
  resolveMotorStage,
  type CastingCuringAddedMotor,
} from "./castingCuringFlowConfig";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form";

type CastingCuringBatch = {
  batchId: string;
  ccStatus?: string;
  formId?: string | null;
  motorStage?: unknown;
  motorType?: unknown;
  [key: string]: any;
};

const CC_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const buildAddedMotorsFromForm = (formData: CastingCuringFormState): CastingCuringAddedMotor[] =>
  (formData.motors ?? []).map((motor) => ({
    motorId: motor.motorId,
    motorReceivedAt: motor.motorReceivedAt,
  }));

export const useCastingAndCuringHook = () => {
  const listParams = useSubdepartmentBatches("casting-and-curing");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "casting-and-curing")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<CastingCuringBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [castingSchemaError, setCastingSchemaError] = useState<string | null>(null);
  const [curingSchemaError, setCuringSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<CastingCuringFormState>(createDefaultCastingCuringFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const [castingType, setCastingType] = useState("");
  const [castingStation, setCastingStation] = useState("");
  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [motorReceivedAt, setMotorReceivedAt] = useState("");
  const [addedMotors, setAddedMotors] = useState<CastingCuringAddedMotor[]>([]);
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        castingType,
        castingStation,
        addedMotors,
      }),
    [formData, castingType, castingStation, addedMotors],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFlowDraft = useCallback(() => {
    setCastingType("");
    setCastingStation("");
    setMotorCount("");
    setDraftMotorIds([]);
    setMotorReceivedAt("");
    setAddedMotors([]);
    setActiveMotorIndex(0);
    setSchemaError(null);
    setCastingSchemaError(null);
    setCuringSchemaError(null);
  }, []);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultCastingCuringFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setCastingSchemaError(null);
    setCuringSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    resetFlowDraft();
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        castingType: "",
        castingStation: "",
        addedMotors: [],
      }),
    );
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchSchemas = useCallback(
    async (batch: CastingCuringBatch) => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return { castingSchema: null, curingSchema: null };
      }

      setSchemaLoading(true);
      setSchemaError(null);
      setCastingSchemaError(null);
      setCuringSchemaError(null);

      const motorStage = resolveMotorStage(batch);
      const requestBase = {
        subDepartmentId,
        motorStage,
      };

      try {
        const [castingResponse, curingResponse] = await Promise.all([
          schemaManagementController.fetchSchema(
            castingCuringCastingSchemaFetchConfig,
            buildCastingCuringSchemaRequest({ ...requestBase, schemaType: "CASTING" }),
          ),
          schemaManagementController.fetchSchema(
            castingCuringCuringSchemaFetchConfig,
            buildCastingCuringSchemaRequest({ ...requestBase, schemaType: "CURING" }),
          ),
        ]);

        const castingSchema = castingResponse?.success ? castingResponse.data : null;
        const curingSchema = curingResponse?.success ? curingResponse.data : null;
        const nextCastingError = castingSchema
          ? null
          : getErrorMessage(castingResponse, "Unable to load casting schema.");
        const nextCuringError = curingSchema
          ? null
          : getErrorMessage(curingResponse, "Unable to load curing schema.");

        setCastingSchemaError(nextCastingError);
        setCuringSchemaError(nextCuringError);

        if (!castingSchema && !curingSchema) {
          const message = nextCuringError ?? nextCastingError ?? "Unable to load casting and curing schema.";
          setSchemaError(message);
          showAlert(message, "error");
        } else {
          setSchemaError(null);
          if (!castingSchema) {
            showAlert(nextCastingError ?? "Casting schema is unavailable.", "warning");
          }
          if (!curingSchema) {
            showAlert(nextCuringError ?? "Curing schema is unavailable.", "warning");
          }
        }

        return { castingSchema, curingSchema };
      } finally {
        setSchemaLoading(false);
      }
    },
    [showAlert, subDepartmentId],
  );

  const openFormWithResolvedData = useCallback(
    async (batch: CastingCuringBatch, editMode: boolean) => {
      const status = parseStatus(batch.ccStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(CC_STATUS.IN_PROGRESS) ||
        status === parseStatus(CC_STATUS.REJECTED);

      let nextBatch = batch;
      let nextFormData = createDefaultCastingCuringFormState();

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!batch.formId) {
          showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        try {
          const detailsResponse = await castingCuringController.fetchFormDetails({
            formId: batch.formId,
            subDepartmentId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.CASTING_CURING.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.CASTING_CURING.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
          nextFormData = mapCastingCuringDetailsToFormState(
            detailsResponse.data?.castingCuringDetails ?? detailsResponse.data,
          );

          const { castingSchema, curingSchema } = await fetchSchemas(nextBatch);
          nextFormData = hydrateCastingCuringFormState(nextFormData, castingSchema, curingSchema);
        } finally {
          setLoadingFormDetails(false);
        }
      }

      const nextAddedMotors = buildAddedMotorsFromForm(nextFormData);

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setCastingType(nextFormData.castingType);
      setCastingStation(nextFormData.castingStation);
      setAddedMotors(nextAddedMotors);
      setMotorCount(nextAddedMotors.length > 0 ? nextAddedMotors.length : "");
      setDraftMotorIds([]);
      setMotorReceivedAt("");
      setInitialSnapshot(
        JSON.stringify({
          formData: nextFormData,
          castingType: nextFormData.castingType,
          castingStation: nextFormData.castingStation,
          addedMotors: nextAddedMotors,
        }),
      );
      setView("form");
    },
    [fetchSchemas, showAlert, subDepartmentId],
  );

  const handleFillForm = useCallback(
    async (batch: CastingCuringBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: CastingCuringBatch) => await openFormWithResolvedData(batch, true),
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

  const handleMotorCountChange = useCallback((count: number | "") => {
    setMotorCount(count);
    if (count === "") {
      setDraftMotorIds([]);
      return;
    }
    setDraftMotorIds((prev) => Array.from({ length: Number(count) }, (_, idx) => prev[idx] ?? ""));
  }, []);

  const handleDraftMotorIdChange = useCallback((index: number, motorId: string) => {
    setDraftMotorIds((prev) => {
      const next = [...prev];
      next[index] = motorId;
      return next;
    });
  }, []);

  useEffect(() => {
    if (view !== "form" || !activeBatch) return;
    const count = resolveCastingMotorCount(castingType, motorCount);
    if (count !== 1) return;
    const motorOptions = (activeBatch.motorIds as string[] | undefined) ?? [];
    const singleId =
      motorOptions.length === 1
        ? String(motorOptions[0])
        : String(activeBatch.motorId ?? "").split(",")[0]?.trim();
    if (!singleId) return;
    setDraftMotorIds((prev) => (prev[0] === singleId ? prev : [singleId]));
  }, [view, activeBatch, castingType, motorCount]);

  const handleStartForm = useCallback(async () => {
    if (!activeBatch) return;

    const count = resolveCastingMotorCount(castingType, motorCount);
    if (count <= 0) return;

    const selectedIds = getSelectedCastingDraftMotorIds(count, draftMotorIds);
    if (!motorReceivedAt.trim()) return;

    const motorOptions = resolveCastingCuringMotorOptions(activeBatch);
    const { castingSchema, curingSchema } = await fetchSchemas(activeBatch);
    if (!castingSchema && !curingSchema) return;

    if (motorOptions.length > 0 && selectedIds.length !== count) {
      showAlert("Select all motor IDs before loading the form.", "warning");
      return;
    }

    const motorSessions: CastingCuringMotorSession[] = selectedIds.map((motorId) =>
      createEmptyMotorSession(motorId, motorReceivedAt.trim(), castingSchema),
    );

    const nextFormData = hydrateCastingCuringFormState(
      {
        ...formData,
        castingType,
        castingStation,
        castingSchema,
        curingSchema,
        motors: motorSessions,
        curingFormValues: curingSchema ? createCastingCuringInitialValues(curingSchema) : {},
      },
      castingSchema,
      curingSchema,
    );

    const nextAdded = selectedIds.map((motorId) => ({
      motorId,
      motorReceivedAt: motorReceivedAt.trim(),
    }));

    setFormData(nextFormData);
    setAddedMotors(nextAdded);
    setDraftMotorIds([]);
    setMotorCount("");
    setMotorReceivedAt("");
    setActiveMotorIndex(0);
  }, [
    activeBatch,
    castingStation,
    castingType,
    draftMotorIds,
    fetchSchemas,
    formData,
    motorCount,
    motorReceivedAt,
    showAlert,
  ]);

  const handleMotorSessionChange = useCallback(
    (motorId: string, nextMotor: CastingCuringMotorSession) => {
      const nextSessions = (formData.motors ?? []).map((motor) =>
        motor.motorId === motorId ? nextMotor : motor,
      );
      setFormData({ ...formData, motors: nextSessions });
    },
    [formData],
  );

  const handleCuringValuesChange = useCallback(
    (values: CastingCuringFormState["curingFormValues"]) => {
      setFormData({ ...formData, curingFormValues: values });
    },
    [formData],
  );

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!formData.curingSchema && !formData.castingSchema) {
        showAlert("Load the form schema before saving.", "warning");
        return false;
      }

      if (!hasAnyCastingCuringValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const status = parseStatus(activeBatch.ccStatus);
      const isCreateFlow = status === parseStatus(CC_STATUS.INITIATED) && !activeBatch.formId;
      const payloadBody = {
        castingCuringDetails: mapCastingCuringFormStateToPayload({
          ...formData,
          castingType,
          castingStation,
        }),
      };

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await castingCuringController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
            return false;
          }
          response = await castingCuringController.updateForm({
            formId: activeBatch.formId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_FAILED
            : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_SUBMIT_SUCCESS,
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
    [
      activeBatch,
      castingStation,
      castingType,
      formData,
      formSnapshot,
      showAlert,
      listParams,
      resetFormContext,
      subDepartmentId,
    ],
  );

  const handleSaveDraft = useCallback(async () => submitForm("draft"), [submitForm]);
  const handleSubmit = useCallback(async () => submitForm("submit"), [submitForm]);

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
    castingSchemaError,
    curingSchemaError,
    subDepartmentId,
    castingType,
    castingStation,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    addedMotors,
    activeMotorIndex,
    setActiveMotorIndex,
    backConfirmOpen,
    setBackConfirmOpen,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    setCastingType,
    setCastingStation,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    setMotorReceivedAt,
    handleStartForm,
    handleMotorSessionChange,
    handleCuringValuesChange,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useCastingAndCuringHook;
