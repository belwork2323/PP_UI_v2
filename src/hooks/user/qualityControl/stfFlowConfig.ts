import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";
import type { StfSubType } from "../../../schema-engine";
import { mapStfSubType } from "../../../schema-engine";

export type STFBatch = {
  id: number | string;
  batchId: string;
  motorId: string;
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  stfStatus: string;
  formId?: string | null;
  subType?: StfSubType | null;
  motorIdNo?: string | null;
  rejectionReason?: string | null;
};

export type StfMotorTypeOption = {
  value: StfSubType;
  label: string;
};

export const STF_MOTOR_TYPE_OPTIONS: StfMotorTypeOption[] = [
  { value: "BEM", label: "BEM" },
  { value: "MAIN_MOTOR", label: "Main Motor" },
];

export const STF_FLOW_LABELS = {
  motorType: "Motor Type",
  motorTypePlaceholder: "Select motor type",
  motorIdNo: "Motor Id No.",
  motorIdNoPlaceholder: "Enter motor id",
  loadForm: "Load Form",
  loadingSchema: "Loading schema...",
};

export const MOCK_STF_BATCHES: STFBatch[] = [
  {
    id: "mock-stf-1",
    batchId: "BATCH-2026-STF-001",
    motorId: "MTR-S0-101",
    motorType: "BEM",
    priority: "High",
    assignedTo: { fullName: "Rajesh Kumar" },
    createdOn: "2026-06-08T09:30:00Z",
    stfStatus: QUALITY_CONTROL_STATUS.INITIATED,
    formId: null,
    subType: null,
    rejectionReason: null,
  },
  {
    id: "mock-stf-2",
    batchId: "BATCH-2026-STF-002",
    motorId: "MTR-S1-205",
    motorType: "MAIN_MOTOR",
    priority: "Critical",
    assignedTo: { fullName: "Anita Sharma" },
    createdOn: "2026-06-10T14:15:00Z",
    stfStatus: QUALITY_CONTROL_STATUS.IN_PROGRESS,
    formId: "STF-FORM-2026-002",
    subType: "MAIN_MOTOR",
    motorIdNo: "MTR-S1-205",
    rejectionReason: null,
  },
  {
    id: "mock-stf-3",
    batchId: "BATCH-2026-STF-003",
    motorId: "BEM-2026-014",
    motorType: "BEM",
    priority: "Medium",
    assignedTo: { fullName: "Vikram Patel" },
    createdOn: "2026-06-12T11:00:00Z",
    stfStatus: QUALITY_CONTROL_STATUS.WAITING_FOR_APPROVAL,
    formId: "STF-FORM-2026-003",
    subType: "BEM",
    rejectionReason: null,
  },
  {
    id: "mock-stf-4",
    batchId: "BATCH-2026-STF-004",
    motorId: "MTR-S2-118",
    motorType: "MAIN_MOTOR",
    priority: "High",
    assignedTo: { fullName: "Priya Menon" },
    createdOn: "2026-06-14T08:45:00Z",
    stfStatus: QUALITY_CONTROL_STATUS.REJECTED,
    formId: "STF-FORM-2026-004",
    subType: "MAIN_MOTOR",
    motorIdNo: "MTR-S2-118",
    rejectionReason: "Sensor configuration incomplete for channel TH2.",
  },
  {
    id: "mock-stf-5",
    batchId: "BATCH-2026-STF-005",
    motorId: "BEM-2026-021",
    motorType: "BEM",
    priority: "Low",
    assignedTo: { fullName: "Suresh Iyer" },
    createdOn: "2026-06-15T16:20:00Z",
    stfStatus: QUALITY_CONTROL_STATUS.APPROVED,
    formId: "STF-FORM-2026-005",
    subType: "BEM",
    rejectionReason: null,
  },
];

export const mergeStfMockBatches = (apiBatches: STFBatch[]): STFBatch[] => {
  const mockIds = new Set(MOCK_STF_BATCHES.map((batch) => batch.batchId));
  const filtered = apiBatches.filter((batch) => !mockIds.has(batch.batchId));
  return [...MOCK_STF_BATCHES, ...filtered];
};

export const canLoadStfForm = (subType: string, motorIdNo: string) => {
  if (!String(subType ?? "").trim()) return false;
  if (mapStfSubType(subType) === "MAIN_MOTOR") {
    return String(motorIdNo ?? "").trim().length > 0;
  }
  return true;
};
