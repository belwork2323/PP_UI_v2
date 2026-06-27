/**
 * BatchConfigs.tsx
 *
 * Pure data-accessor helpers for the Batch Management module.
 * Visual style configs (stageConfig, statusConfig, priorityConfig, getDeptConfig)
 * now live in batchManagement_theme.ts and are re-exported here for
 * backwards compatibility.
 */

import { motorStageLabel, formatBatchSubDepartmentLabel, parseBatchWorkflowFromApi } from "../../../../../../data/models/admin/BatchManagementModel";
import { normalizeSubdepartmentBatchStatus } from "../../../../../../data/models/user/SubdepartmentBatchModel";

// Re-export style configs from their canonical home in the theme
export {
  stageConfig,
  statusConfig,
  priorityConfig,
  getDeptConfig,
} from "../../../../../../app/theme/custom_themes/admin/batchManagement_theme";

// ── Pure field accessor helpers ──────────────────────────────────────────────
// These are aligned to the actual BatchListItemModel shape returned by the controller.

export const getBatchId    = (b: any): string => b.batchId     || b.id        || "—";
/** motorIds is an array; display first ID or all IDs comma-separated */
export const getMotorId    = (b: any): string => {
  if (Array.isArray(b.motorIds) && b.motorIds.length > 0) {
    return b.motorIds.join(", ");
  }
  return b.motorId || "—";
};
/** motorStage from list/details API (number or stage letter); legacy motorType supported */
export const getMotorStage = (b: any): string => {
  const stage = b.motorStage ?? b.motorType;
  if (stage == null || stage === "") return "—";
  if (typeof stage === "object") {
    return motorStageLabel(stage.motorStage ?? stage.motorTypeName);
  }
  return motorStageLabel(stage);
};

/** @deprecated Use getMotorStage */
export const getMotorType = getMotorStage;
/** Current department name (Sourcing, Manufacturing, etc.) */
export const getStage = (b: any): string => {
  const name = String(b?.department?.departmentName ?? "").trim();
  if (name) return name;

  const workflow = parseBatchWorkflowFromApi({
    ...(b ?? {}),
    stage: b?.rawStage ?? b?.stage,
  });
  return workflow.department?.departmentName?.trim() || "—";
};

export const getStatus     = (b: any): string => normalizeSubdepartmentBatchStatus(b.status);
export const getPriority   = (b: any): string => b.priority    || "Medium";
/** top-level department object */
export const getDept       = getStage;
/** Current sub-department where the batch is active */
export const getSubDept    = (b: any): string => {
  if (Array.isArray(b?.subDepartments) && b.subDepartments.length > 0) {
    const name = b.subDepartments[0]?.subDepartmentName;
    return name ? formatBatchSubDepartmentLabel(name) : "—";
  }

  const flat = b?.subDepartment ?? b?.subDept ?? b?.currentSubDepartment ?? b?.subDepartmentName;
  if (typeof flat === "string" && flat.trim()) {
    return formatBatchSubDepartmentLabel(flat);
  }

  const workflow = parseBatchWorkflowFromApi({
    ...(b ?? {}),
    stage: b?.rawStage ?? b?.stage,
  });
  const name = workflow.subDepartments[0]?.subDepartmentName;
  return name ? formatBatchSubDepartmentLabel(name) : "—";
};
/** Display label for system manager (list uses nested object; legacy uses flat id) */
export const getSystemManagerLabel = (b: any): string =>
  b.systemManager?.name?.trim() ||
  b.systemManager?.id ||
  b.systemManagerId ||
  "—";

/** @deprecated Use getSystemManagerLabel */
export const getSystemManagerId = (b: any) => getSystemManagerLabel(b);
/** createdBy is { id, name } in the model */
export const getCreatedOn  = (b: any) => b.createdOn     || b.createdAt  || null;
export const getCreatedBy  = (b: any) => b.createdBy     ?? null;
export const getNotes      = (b: any): string => b.notes || b.description || "";

/** Normalized API value: DRAFT | COMPLETED | empty */
export const getIdentificationSheetStatus = (b: any): string =>
  String(b.identificationSheetStatus ?? b.identification_sheet_status ?? "")
    .trim()
    .toUpperCase();

export const isIdentificationSheetDraft = (b: any): boolean => {
  const status = getIdentificationSheetStatus(b);
  if (status === "DRAFT") return true;
  if (status === "COMPLETED") return false;
  return !b.identificationSheet || Object.keys(b.identificationSheet).length === 0;
};

export const isIdentificationSheetCompleted = (b: any): boolean => {
  const status = getIdentificationSheetStatus(b);
  if (status === "COMPLETED") return true;
  if (status === "DRAFT") return false;
  return Boolean(b.identificationSheet && Object.keys(b.identificationSheet).length > 0);
};

/** @deprecated Use isIdentificationSheetDraft */
export const needsImplementationCompletion = isIdentificationSheetDraft;