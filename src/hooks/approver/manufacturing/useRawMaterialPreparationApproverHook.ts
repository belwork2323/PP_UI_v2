import { useEffect, useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { operationsController } from "../../../controllers/user/operationsController";
import rawMaterialPreparationController from "../../../controllers/user/manufacturing/rawMaterialPreparationController";
import { APPROVER_BATCH_STATUS_TABS } from "../../../data/models/approver/ApproverBatchListModel";
import { normalizeMotorStage } from "../../../data/models/admin/BatchManagementModel";
import {
  mapRawMaterialPreparationDetailsForDisplay,
  type RawMaterialPreparationDetails,
} from "../../../data/models/user/RawMaterialPreparationModel";
import { normalizeBatchTypeCode } from "../../../data/models/user/SubdepartmentBatchModel";
import useApproverFormAction from "../useApproverFormAction";

const DEPARTMENT = "manufacturing" as const;
const SUB_DEPARTMENT = "raw-material-prep";
const S = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const FILTER_ALL = STRINGS.APPROVER.COMMON.STATUS_ALL;

export type RawMaterialPrepApproverAppliedFilters = {
  batchId: string;
  batchType: string;
  motorId: string;
  motorStage: string;
  submittedBy: string;
  fromDate: string;
  toDate: string;
};

const emptyAppliedFilters = (): RawMaterialPrepApproverAppliedFilters => ({
  batchId: "",
  batchType: "",
  motorId: "",
  motorStage: "",
  submittedBy: "",
  fromDate: "",
  toDate: "",
});

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
};

type MotorStageOption = {
  motorStage: string;
};

const parseRowDate = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const applyRawMaterialPrepApproverClientFilters = <T extends Record<string, unknown>>(
  rows: T[],
  filters: RawMaterialPrepApproverAppliedFilters,
): T[] => {
  const batchIdQuery = filters.batchId.trim().toLowerCase();
  const batchTypeFilter = filters.batchType.trim();
  const motorIdQuery = filters.motorId.trim().toLowerCase();
  const motorStageFilter = filters.motorStage.trim();
  const submittedByQuery = filters.submittedBy.trim().toLowerCase();
  let fromDate = filters.fromDate.trim();
  let toDate = filters.toDate.trim();

  if (fromDate && toDate && fromDate > toDate) {
    const swap = fromDate;
    fromDate = toDate;
    toDate = swap;
  }

  return rows.filter((row) => {
    if (batchIdQuery && !String(row.batchId ?? "").toLowerCase().includes(batchIdQuery)) {
      return false;
    }

    if (batchTypeFilter) {
      const rowCode = normalizeBatchTypeCode(String(row.batchType ?? ""));
      if (normalizeBatchTypeCode(batchTypeFilter) !== rowCode) return false;
    }

    if (motorIdQuery && !String(row.motorId ?? "").toLowerCase().includes(motorIdQuery)) {
      return false;
    }

    if (motorStageFilter) {
      const rowStage = String(normalizeMotorStage(row.motorStage ?? row.motorType));
      if (rowStage !== String(normalizeMotorStage(motorStageFilter))) return false;
    }

    if (submittedByQuery && !String(row.submittedBy ?? "").toLowerCase().includes(submittedByQuery)) {
      return false;
    }

    if (fromDate || toDate) {
      const rowDate = parseRowDate(row.createdOn);
      if (!rowDate) return false;
      const day = rowDate.toISOString().slice(0, 10);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
    }

    return true;
  });
};

export const useRawMaterialPreparationApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<RawMaterialPrepApproverAppliedFilters>(emptyAppliedFilters);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [motorStageOptions, setMotorStageOptions] = useState<MotorStageOption[]>([]);
  const [motorStagesLoading, setMotorStagesLoading] = useState(false);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
  });

  useEffect(() => {
    let active = true;

    const loadMotorStages = async () => {
      setMotorStagesLoading(true);
      try {
        const response = await operationsController.fetchMotorsStageList();
        if (!active) return;
        const stages = Array.isArray(response?.data) ? response.data : [];
        setMotorStageOptions(
          stages
            .map((stage: { motorStage?: string | number }) => ({
              motorStage: String(stage.motorStage ?? "").trim(),
            }))
            .filter((stage) => stage.motorStage),
        );
      } catch {
        if (active) setMotorStageOptions([]);
      } finally {
        if (active) setMotorStagesLoading(false);
      }
    };

    void loadMotorStages();

    return () => {
      active = false;
    };
  }, []);

  const listFiltersRecord = useMemo(
    () => ({
      batchId: appliedFilters.batchId,
      batchType: appliedFilters.batchType || FILTER_ALL,
      motorId: appliedFilters.motorId,
      motorStage: appliedFilters.motorStage || FILTER_ALL,
      submittedBy: appliedFilters.submittedBy,
      fromDate: appliedFilters.fromDate,
      toDate: appliedFilters.toDate,
    }),
    [appliedFilters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.batchId.trim()) count += 1;
    if (appliedFilters.batchType.trim()) count += 1;
    if (appliedFilters.motorId.trim()) count += 1;
    if (appliedFilters.motorStage.trim()) count += 1;
    if (appliedFilters.submittedBy.trim()) count += 1;
    if (appliedFilters.fromDate.trim()) count += 1;
    if (appliedFilters.toDate.trim()) count += 1;
    if (statusFilter !== FILTER_ALL) count += 1;
    return count;
  }, [appliedFilters, statusFilter]);

  const applyPanelFilters = (
    next: RawMaterialPrepApproverAppliedFilters & { status: string },
  ) => {
    setAppliedFilters({
      batchId: next.batchId,
      batchType: next.batchType,
      motorId: next.motorId,
      motorStage: next.motorStage,
      submittedBy: next.submittedBy,
      fromDate: next.fromDate,
      toDate: next.toDate,
    });
    setStatusFilter(next.status || FILTER_ALL);
  };

  const clearListFilters = () => {
    setAppliedFilters(emptyAppliedFilters());
    setStatusFilter(FILTER_ALL);
  };

  const statusTabs = useMemo(() => [FILTER_ALL, ...APPROVER_BATCH_STATUS_TABS], []);

  const statusDropdownValues = useMemo(
    () => [FILTER_ALL, ...APPROVER_BATCH_STATUS_TABS],
    [],
  );

  const handleViewDetails = async (row: ApproverListRow) => {
    setSelected({ ...row });
    setDetailsLoading(true);

    const formId = String(row?.formId ?? "").trim();

    if (!formId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await rawMaterialPreparationController.fetchFormDetails({ formId });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback =
        response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const { detailView, weightmentSheet } = mapRawMaterialPreparationDetailsForDisplay(
      response.data as RawMaterialPreparationDetails,
    );

    setSelected({
      ...row,
      formId: detailView?.formId || formId,
      batchId: detailView?.batchId || row.batchId,
      detailView,
      weightmentSheet,
    });
  };

  const handleCloseDetail = () => {
    if (detailsLoading) return;
    setSelected(null);
  };

  return {
    items,
    selected,
    detailsLoading,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
    appliedFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel: FILTER_ALL,
    motorStageOptions,
    motorStagesLoading,
    applyClientFilters: applyRawMaterialPrepApproverClientFilters,
  };
};

export default useRawMaterialPreparationApproverHook;
