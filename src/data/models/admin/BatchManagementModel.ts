/* ─────────────────────────────────────────────────────────────────────────────
   BATCH MANAGEMENT MODELS
   Aligned to admin batch API request / response contracts (list, details, create, update).
───────────────────────────────────────────────────────────────────────────── */

import { icons } from "../../../app/theme";
import { normalizeSubdepartmentBatchStatus } from "../user/SubdepartmentBatchModel";

/** Map display / list labels to form/API enum values */
function normalizeBatchTypeForForm(raw: string | undefined | null): string {
  if (!raw) return "MAIN";
  const s = String(raw).trim();
  const u = s.toUpperCase();
  if (u === "MAIN" || u.includes("MAIN")) return "MAIN";
  if (u === "SUBSCALE" || u.includes("SUBSCALE")) return "SUBSCALE";
  return s;
}

/** API motorStage may be a number (0, 1) or stage letter ("B") */
export function normalizeMotorStage(raw: unknown): string | number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const asNumber = Number(trimmed);
    return Number.isFinite(asNumber) && String(asNumber) === trimmed ? asNumber : trimmed;
  }
  if (typeof raw === "object") {
    const obj = raw as { motorStage?: unknown; motorTypeName?: string };
    if (obj.motorStage !== undefined && obj.motorStage !== null) {
      return normalizeMotorStage(obj.motorStage);
    }
    if (obj.motorTypeName) return String(obj.motorTypeName).trim();
  }
  return String(raw);
}

/** Coerce form motor stage to API value (numeric when applicable) */
export function motorStageForApi(raw: unknown): string | number | undefined {
  const normalized = normalizeMotorStage(raw);
  if (normalized === null) return undefined;
  return normalized;
}

export function motorStageLabel(stage: string | number | null | undefined): string {
  if (stage === null || stage === undefined || stage === "") return "—";
  const value = String(stage).trim();
  if (!value) return "—";
  if (/^stage\s/i.test(value)) return value;
  return `Stage ${value}`;
}

const BATCH_DEPARTMENT_NAMES = new Set([
  "Sourcing",
  "Manufacturing",
  "Quality Control",
  "Dispatch",
]);

/** Human-readable label for API sub-department names / slugs / PascalCase values */
export function formatBatchSubDepartmentLabel(name: string | null | undefined): string {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "—";
  if (/\s/.test(trimmed)) return trimmed;
  if (trimmed.includes("-")) {
    return trimmed
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return trimmed
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

type BatchWorkflowSubDepartment = {
  subDepartmentId: number;
  subDepartmentName: string;
};

function normalizeSubDepartmentEntry(raw: unknown): BatchWorkflowSubDepartment | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const name = raw.trim();
    if (!name) return null;
    return { subDepartmentId: 0, subDepartmentName: name };
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const name = String(obj.subDepartmentName ?? obj.name ?? obj.label ?? "").trim();
    if (!name) return null;
    return {
      subDepartmentId: Number(obj.subDepartmentId ?? obj.id ?? 0) || 0,
      subDepartmentName: name,
    };
  }
  return null;
}

/** Resolve current department + sub-department from list/details API shapes */
export function parseBatchWorkflowFromApi(data: Record<string, any>) {
  const rawStage =
    data.stage ??
    data.workflowStage ??
    data.currentStage ??
    data.currentWorkflow ??
    data.rawStage ??
    null;

  const existingDeptName = String(data.department?.departmentName ?? "").trim();
  const existingSubDepts = Array.isArray(data.subDepartments)
    ? data.subDepartments
        .map(normalizeSubDepartmentEntry)
        .filter((item): item is BatchWorkflowSubDepartment => item != null)
    : [];

  let department =
    existingDeptName
      ? {
          departmentId: data.department?.departmentId ?? null,
          departmentName: existingDeptName,
        }
      : null;
  let subDepartments = [...existingSubDepts];

  const pushSubDept = (raw: unknown) => {
    const entry = normalizeSubDepartmentEntry(raw);
    if (!entry) return;
    if (subDepartments.some((item) => item.subDepartmentName === entry.subDepartmentName)) return;
    subDepartments = [...subDepartments, entry];
  };

  if (typeof rawStage === "string") {
    const label = rawStage.trim();
    if (label) {
      if (BATCH_DEPARTMENT_NAMES.has(label)) {
        department = { departmentId: null, departmentName: label };
      } else {
        pushSubDept(label);
      }
    }
  } else if (rawStage && typeof rawStage === "object") {
    const stageObj = rawStage as Record<string, any>;
    const deptNode =
      stageObj.department && typeof stageObj.department === "object"
        ? stageObj.department
        : stageObj.departmentId != null || stageObj.departmentName
          ? stageObj
          : null;

    if (deptNode) {
      const deptName = String(deptNode.departmentName ?? "").trim();
      if (deptName) {
        department = {
          departmentId: deptNode.departmentId ?? null,
          departmentName: deptName,
        };
      }

      const nested = Array.isArray(deptNode.subDepartments)
        ? deptNode.subDepartments
        : Array.isArray(deptNode.subDepartment)
          ? deptNode.subDepartment
          : [];
      nested.forEach(pushSubDept);

      if (nested.length === 0) {
        pushSubDept(deptNode.subDepartmentName ?? stageObj.subDepartmentName);
      }
    } else {
      const stageDept = String(stageObj.departmentName ?? "").trim();
      if (stageDept && BATCH_DEPARTMENT_NAMES.has(stageDept)) {
        department = { departmentId: stageObj.departmentId ?? null, departmentName: stageDept };
      }
      pushSubDept(stageObj.subDepartmentName ?? stageObj.label ?? stageObj.name);
    }
  }

  if (!department) {
    const departmentName = data.departmentName ?? data.currentDepartment;
    if (typeof departmentName === "string" && departmentName.trim()) {
      department = {
        departmentId: data.departmentId ?? null,
        departmentName: departmentName.trim(),
      };
    }
  }

  if (subDepartments.length === 0) {
    pushSubDept(
      data.subDepartment ??
        data.subDept ??
        data.currentSubDepartment ??
        data.subDepartmentName
    );
  }

  if (subDepartments.length === 0 && data.currentSubDepartment) {
    pushSubDept(data.currentSubDepartment);
  }

  return { department, subDepartments, rawStage };
}

/* ─────────────────────────────────────────────────────────────────────────────
   READ MODEL  —  BatchListItemModel
   Maps response.data.batches[] items and response.data.batch (details).

   List extras: projectName, lotIds, systemManager { id, name }, identificationSheetStatus
───────────────────────────────────────────────────────────────────────────── */
export class BatchListItemModel {
  id                  : string | null;
  batchId             : string;
  batchType           : string;
  subBatchType        : string | null;
  projectId           : string | null;
  /** Present on list API for display */
  projectName         : string | null;
  numberOfMotors      : number;
  motorIds            : string[];
  lotIds              : string[];
  motorStage          : string | number | null;
  priority            : string;
  systemManagerId     : string;
  systemManager       : { id: string; name: string } | null;

  // Flattened stage / department fields for easy table access
  department          : { departmentId: number | null; departmentName: string } | null;
  subDepartments      : { subDepartmentId: number; subDepartmentName: string }[];
  rawStage            : unknown;

  status              : string;
  createdOn           : string | null;
  createdBy           : { id: string; name: string } | null;
  updatedOn           : string | null;
  updatedBy           : { id: string; name: string } | null;

  /** List: "Draft" | "Completed" when provided */
  identificationSheetStatus : string | null;

  // Implementation details (optional)
  identificationSheet : IdentificationSheet | null;
  objective           : string | null;
  articles            : string[];

  constructor(data: Record<string, any>) {
    this.id              = data.id              ?? null;
    this.batchId         = data.batchId         ?? "";
    this.batchType       = normalizeBatchTypeForForm(data.batchType);
    this.subBatchType    = data.subBatchType    ?? null;
    this.projectId       = data.projectId       ?? null;
    this.projectName     = data.projectName     ?? null;
    this.numberOfMotors  = data.numberOfMotors  ?? 0;
    this.motorIds        = Array.isArray(data.motorIds) ? data.motorIds : [];
    this.lotIds          = Array.isArray(data.lotIds) ? data.lotIds : [];
    this.priority        = data.priority        ?? "Medium";
    this.status          = normalizeSubdepartmentBatchStatus(data.status);

    this.motorStage = normalizeMotorStage(
      data.motorStage ?? data.motorType ?? data.motorTypeName
    );

    if (data.systemManager && typeof data.systemManager === "object") {
      this.systemManager = {
        id: data.systemManager.id ?? "",
        name: data.systemManager.name ?? data.systemManager.fullName ?? "",
      };
      this.systemManagerId = this.systemManager.id;
    } else {
      this.systemManager = null;
      this.systemManagerId = String(data.systemManagerId ?? "").trim();
    }

    this.identificationSheetStatus =
      data.identificationSheetStatus ?? data.identification_sheet_status ?? null;

    const workflow = parseBatchWorkflowFromApi(data);
    this.department = workflow.department;
    this.subDepartments = workflow.subDepartments;
    this.rawStage = workflow.rawStage;

    // Audit fields
    this.createdOn = data.createdOn ?? null;
    this.createdBy = data.createdBy
      ? { id: data.createdBy.id ?? "", name: data.createdBy.name ?? data.createdBy.fullName ?? "" }
      : null;

    // updatedOn / updatedBy only present in the detail endpoint response
    this.updatedOn = data.updatedOn ?? null;
    this.updatedBy = data.updatedBy
      ? { id: data.updatedBy.id ?? "", name: data.updatedBy.name ?? "" }
      : null;

    // Implementation details (optional)
    this.identificationSheet = data.identificationSheet
      ? parseIdentificationSheetFromApi(data.identificationSheet)
      : null;
    this.objective           = data.objective ?? null;
    this.articles            = Array.isArray(data.articles) ? data.articles : [];
  }

  static fromApi(data: Record<string, any>) {
    return new BatchListItemModel(data);
  }
}

function batchRowToRecord(row: BatchListItemModel | Record<string, any> | null | undefined) {
  if (!row) return {};
  return { ...(row as Record<string, any>) };
}

function hasDepartmentName(row: Record<string, any>) {
  return Boolean(String(row.department?.departmentName ?? "").trim());
}

function hasSubDepartments(row: Record<string, any>) {
  return Array.isArray(row.subDepartments) && row.subDepartments.length > 0;
}

function pickRawStage(detail: Record<string, any>, list: Record<string, any>) {
  if (detail.rawStage != null && detail.rawStage !== "") return detail.rawStage;
  if (detail.stage != null && detail.stage !== "") return detail.stage;
  if (list.rawStage != null && list.rawStage !== "") return list.rawStage;
  return list.stage ?? null;
}

/** Preserve list workflow fields when the details API omits stage/status/priority. */
export function mergeBatchListAndDetailRows(
  listRow: BatchListItemModel | Record<string, any> | null | undefined,
  detailRow: BatchListItemModel | Record<string, any> | null | undefined,
): BatchListItemModel {
  const list = batchRowToRecord(listRow);
  const detail = batchRowToRecord(detailRow);

  return BatchListItemModel.fromApi({
    ...list,
    ...detail,
    department: hasDepartmentName(detail) ? detail.department : list.department,
    subDepartments: hasSubDepartments(detail) ? detail.subDepartments : list.subDepartments,
    stage: pickRawStage(detail, list),
    rawStage: pickRawStage(detail, list),
    subDepartment: detail.subDepartment ?? list.subDepartment,
    subDept: detail.subDept ?? list.subDept,
    subDepartmentName: detail.subDepartmentName ?? list.subDepartmentName,
    departmentName: detail.departmentName ?? list.departmentName ?? list.department?.departmentName,
    status: detail.status ?? list.status,
    priority: detail.priority ?? list.priority,
    identificationSheetStatus:
      detail.identificationSheetStatus ?? list.identificationSheetStatus,
    projectName: detail.projectName ?? list.projectName,
    systemManager: detail.systemManager ?? list.systemManager,
    lotIds: Array.isArray(detail.lotIds) && detail.lotIds.length > 0 ? detail.lotIds : list.lotIds,
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   IDENTIFICATION SHEET MODELS
───────────────────────────────────────────────────────────────────────────── */

/** UI / read model — may include display-only fields from lot lookup */
export interface MaterialItem {
  srNo                  : number;
  materialCode          : string;
  materialName?         : string;
  lotId                 : string;
  make                  : string;
  manufacturerName?     : string;
  requiredComposition   : number;
  quantityPerPremix     : number;
  revalidationFromDate? : string;
  revalidationToDate?   : string;
  /** @deprecated Legacy single date — mapped to from/to when posting */
  revalidationDate?     : string;
}

export interface IdentificationSheet {
  date              : string;
  batchSize         : number;
  bondingSheetNo    : string;
  mixerType         : string;
  BldgNo            : string;
  numberOfPremix    : number;
  remarks           : string;
  materials         : MaterialItem[];
  /** @deprecated Legacy field — read from API responses when mixerType absent */
  mixerDetails?     : string;
}

function serializeMaterialForApi(material: Record<string, any>): Record<string, unknown> {
  const fromDate =
    material.revalidationFromDate ?? material.revalidationDate ?? "";
  const toDate =
    material.revalidationToDate ?? material.revalidationDate ?? fromDate;

  return {
    srNo                : material.srNo,
    materialCode        : material.materialCode,
    lotId               : material.lotId ?? "",
    make                : String(material.make ?? material.manufacturerName ?? "").trim(),
    requiredComposition : material.requiredComposition ?? 0,
    quantityPerPremix   : material.quantityPerPremix ?? 0,
    revalidationFromDate: fromDate,
    revalidationToDate  : toDate,
  };
}

/** Map form identification sheet to API request body */
export function serializeIdentificationSheetForApi(
  sheet: Record<string, any> | null | undefined
): Record<string, unknown> {
  if (!sheet || typeof sheet !== "object") return {};

  const isDefaultEmpty =
    !sheet.date &&
    (!sheet.batchSize || sheet.batchSize === 0) &&
    !sheet.bondingSheetNo &&
    !sheet.mixerType && !sheet.mixerDetails &&
    !sheet.BldgNo && !sheet.bldgNo &&
    (sheet.numberOfPremix === 1 || sheet.numberOfPremix == null) &&
    !sheet.remarks &&
    (!Array.isArray(sheet.materials) || sheet.materials.length === 0);

  if (isDefaultEmpty) return {};

  const payload: Record<string, unknown> = {
    date           : sheet.date ?? "",
    batchSize      : sheet.batchSize ?? 0,
    bondingSheetNo : sheet.bondingSheetNo ?? "",
    mixerType      : String(sheet.mixerType ?? sheet.mixerDetails ?? "").trim(),
    BldgNo         : String(sheet.BldgNo ?? sheet.bldgNo ?? "").trim(),
    numberOfPremix : sheet.numberOfPremix ?? 0,
    remarks        : sheet.remarks ?? "",
  };

  if (Array.isArray(sheet.materials)) {
    payload.materials = sheet.materials.length > 0
      ? sheet.materials.map(serializeMaterialForApi)
      : [];
  }

  return payload;
}

/** Map API identification sheet to form state */
export function parseIdentificationSheetFromApi(
  sheet: Record<string, any> | null | undefined
): IdentificationSheet {
  if (!sheet || typeof sheet !== "object") {
    return {
      date: "", batchSize: 0, bondingSheetNo: "", mixerType: "", BldgNo: "",
      numberOfPremix: 1, remarks: "", materials: [],
    };
  }

  const materials = Array.isArray(sheet.materials)
    ? sheet.materials.map((m: Record<string, any>) => ({
        srNo                : m.srNo ?? 0,
        materialCode        : m.materialCode ?? "",
        materialName        : m.materialName ?? "",
        lotId               : m.lotId ?? "",
        make                : m.make ?? m.manufacturerName ?? "",
        manufacturerName    : m.manufacturerName ?? m.make ?? "",
        requiredComposition : m.requiredComposition ?? 0,
        quantityPerPremix   : m.quantityPerPremix ?? 0,
        revalidationFromDate: m.revalidationFromDate ?? m.revalidationDate ?? "",
        revalidationToDate  : m.revalidationToDate ?? m.revalidationDate ?? "",
        revalidationDate    : m.revalidationFromDate ?? m.revalidationDate ?? "",
      }))
    : [];

  return {
    date           : sheet.date ?? "",
    batchSize      : sheet.batchSize ?? 0,
    bondingSheetNo : sheet.bondingSheetNo ?? "",
    mixerType      : sheet.mixerType ?? sheet.mixerDetails ?? "",
    BldgNo         : sheet.BldgNo ?? sheet.bldgNo ?? "",
    numberOfPremix : sheet.numberOfPremix ?? 1,
    remarks        : sheet.remarks ?? "",
    materials,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   WRITE MODELS — CreateBatchPayload / UpdateBatchPayload
   Updated to support the new two-step batch creation workflow.
   Step 1: Create batch with basic details (identificationSheet is optional)
   Step 2: Update batch with implementation details (identificationSheet)
───────────────────────────────────────────────────────────────────────────── */

export interface BatchWritePayload {
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string | null;
  motorStage?         : string | number;
  numberOfMotors?     : number;
  motorIds?           : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: Record<string, unknown>;
  objective?          : string;
  articles?           : string[];
}

/**
 * Write model — used when POSTing a new batch (Step 1).
 * identificationSheet is optional in create API.
 * Controller builds this from raw form values.
 */
function applyBatchWriteFields(
  target: BatchWritePayload,
  form: Record<string, any>
): void {
  target.batchType = form.batchType ?? "MAIN";
  target.subBatchType =
    target.batchType === "SUBSCALE" && form.subBatchType ? form.subBatchType : undefined;

  const isExperimental =
    target.batchType === "SUBSCALE" && form.subBatchType === "EXPERIMENTAL";

  if (isExperimental) {
    const raw = form.projectId;
    target.projectId =
      raw === "" || raw === undefined || raw === null ? null : String(raw).trim();
  } else {
    const raw = form.projectId;
    target.projectId =
      raw === "" || raw === undefined || raw === null ? undefined : String(raw).trim();
  }

  if (!isExperimental) {
    const stage = motorStageForApi(form.motorStage ?? form.motorType);
    if (stage !== undefined) target.motorStage = stage;

    target.numberOfMotors = form.numberOfMotors ?? 0;
    target.motorIds = Array.isArray(form.motorIds)
      ? form.motorIds.filter((id: string) => String(id ?? "").trim())
      : form.motorIds
        ? [form.motorIds]
        : [];
  }

  target.priority = form.priority ?? "Medium";
  target.systemManagerId = String(form.systemManagerId ?? "").trim();

  if (form.identificationSheet !== undefined) {
    target.identificationSheet = serializeIdentificationSheetForApi(form.identificationSheet);
  }

  if (form.objective?.trim()) target.objective = form.objective.trim();
  if (Array.isArray(form.articles) && form.articles.length > 0) {
    target.articles = form.articles;
  }
}

export class CreateBatchPayload implements BatchWritePayload {
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string | null;
  motorStage?         : string | number;
  numberOfMotors?     : number;
  motorIds?           : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: Record<string, unknown>;
  objective?          : string;
  articles?           : string[];

  constructor(form: Record<string, any>) {
    applyBatchWriteFields(this, form);
  }
}

/**
 * Write model — PUT /admin/batch/update (body includes batchId per API contract).
 */
export class UpdateBatchPayload implements BatchWritePayload {
  batchId             : string;
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string | null;
  motorStage?         : string | number;
  numberOfMotors?     : number;
  motorIds?           : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: Record<string, unknown>;
  objective?          : string;
  articles?           : string[];

  constructor(batchId: string, form: Record<string, any>) {
    this.batchId = String(batchId ?? "").trim();
    applyBatchWriteFields(this, form);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   BATCH STATISTICS MODEL
───────────────────────────────────────────────────────────────────────────── */

const STAT_CONFIG = {
  totalBatches     : { label: "Total Batches",      variant: "total",      icon: icons.batchMgmt.batchIcon },
  inProgressBatches: { label: "In Progress",        variant: "inProgress", icon: icons.batchMgmt.inProgressStatus },
  completedBatches : { label: "Completed",          variant: "completed",  icon: icons.batchMgmt.completedStatus },
  pendingApprovals : { label: "Pending Approvals",  variant: "pending",    icon: icons.batchMgmt.pendingStatus },
  rejectedBatches  : { label: "Rejected",           variant: "rejected",   icon: icons.batchMgmt.rejectedStatus },
};

export class BatchStatsModel {
  static fromStatsApi(apiResponse: any) {
    const { data } = apiResponse;
    if (!data) return [];

    return Object.entries(STAT_CONFIG).map(([apiKey, config]) => {
      const statData = (data as any)[apiKey] || { count: 0, subValue: 0 };

      return {
        label   : config.label,
        value   : BatchStatsModel.formatNumber(statData.count),
        rawValue: statData.count,
        subLabel: statData.subValue !== 0
          ? (statData.subValue > 0
              ? `+${statData.subValue} this period`
              : `${statData.subValue} this period`)
          : "",
        icon   : config.icon,
        variant: config.variant,
      };
    });
  }

  static formatNumber(num: number): string {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}