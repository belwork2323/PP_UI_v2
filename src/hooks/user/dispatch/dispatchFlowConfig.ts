import { OPERATION_STATUS } from "../../operationStatus";

export type DispatchBatch = {
  id: number | string;
  batchId: string;
  projectId?: string;
  projectName?: string;
  motorId: string;
  motorType: string;
  motorStage?: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  dispatchStatus: string;
  formId?: string | null;
  rejectionReason?: string | null;
};

export type DispatchStageOption = {
  value: string;
  label: string;
};

export const DISPATCH_STAGE_OPTIONS: DispatchStageOption[] = [
  { value: "0", label: "Stage 0" },
  { value: "1", label: "Stage 1" },
  { value: "2", label: "Stage 2" },
  { value: "3", label: "Stage 3" },
];

export const DISPATCH_YES_NO_OPTIONS = [
  { value: "YES", label: "YES" },
  { value: "NO", label: "NO" },
];

export const DISPATCH_FLOW_LABELS = {
  stage: "Stage",
  stagePlaceholder: "Select stage",
  motorId: "Motor ID",
  motorIdPlaceholder: "Select motor ID",
  castingDate: "Date of Casting",
  dispatchDate: "Dispatch Date",
  dispatchLocation: "Dispatch Location",
  dispatchLocationPlaceholder: "Enter dispatch location",
  ndtClearance: "NDT Clearance Accorded",
  ndtMomNo: "Enter MOM No.",
  ndtMomNoPlaceholder: "Enter NDT MOM number",
  finalAcceptanceClearance: "Final Acceptance Committee Clearance Accorded",
  finalAcceptanceMomNo: "Enter MOM No.",
  finalAcceptanceMomNoPlaceholder: "Enter final acceptance MOM number",
  loadForm: "Load Form",
  loadingSchema: "Loading schema...",
};

const MOCK_DISPATCH_MOTORS: Record<string, Record<string, string[]>> = {
  "BATCH-2026-DSP-001": {
    "0": ["MTR-S0-301", "MTR-S0-302"],
    "1": ["MTR-S1-401", "MTR-S1-402"],
    "2": ["MTR-S2-501"],
    "3": ["MTR-S3-601"],
  },
  "BATCH-2026-DSP-002": {
    "0": ["MTR-S0-310"],
    "1": ["MTR-S1-410", "MTR-S1-411"],
    "2": ["MTR-S2-510"],
    "3": ["MTR-S3-610", "MTR-S3-611"],
  },
};

export const getDispatchMotorOptions = (
  batchId?: string | null,
  stage?: string | null,
): Array<{ value: string; label: string }> => {
  const normalizedStage = String(stage ?? "").trim();
  if (!batchId || !normalizedStage) return [];

  const motors =
    MOCK_DISPATCH_MOTORS[batchId]?.[normalizedStage] ??
    [`${batchId}-S${normalizedStage}-MTR-001`, `${batchId}-S${normalizedStage}-MTR-002`];

  return motors.map((motorId) => ({ value: motorId, label: motorId }));
};

export const MOCK_DISPATCH_BATCHES: DispatchBatch[] = [
  {
    id: "mock-dispatch-1",
    batchId: "BATCH-2026-DSP-001",
    projectId: "PRJ-A",
    projectName: "Project A",
    motorId: "MTR-S0-301",
    motorType: "0",
    motorStage: "0",
    priority: "High",
    assignedTo: { fullName: "Rajesh Kumar" },
    createdOn: "2026-06-08T09:30:00Z",
    dispatchStatus: OPERATION_STATUS.INITIATED,
    formId: null,
    rejectionReason: null,
  },
  {
    id: "mock-dispatch-2",
    batchId: "BATCH-2026-DSP-002",
    projectId: "PRJ-B",
    projectName: "Project B",
    motorId: "MTR-S1-410",
    motorType: "1",
    motorStage: "1",
    priority: "Critical",
    assignedTo: { fullName: "Anita Sharma" },
    createdOn: "2026-06-10T14:15:00Z",
    dispatchStatus: OPERATION_STATUS.IN_PROGRESS,
    formId: "DSP-FORM-2026-002",
    rejectionReason: null,
  },
  {
    id: "mock-dispatch-3",
    batchId: "BATCH-2026-DSP-003",
    projectId: "PRJ-C",
    projectName: "Project C",
    motorId: "MTR-S2-520",
    motorType: "2",
    motorStage: "2",
    priority: "Medium",
    assignedTo: { fullName: "Vikram Patel" },
    createdOn: "2026-06-12T11:00:00Z",
    dispatchStatus: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    formId: "DSP-FORM-2026-003",
    rejectionReason: null,
  },
  {
    id: "mock-dispatch-4",
    batchId: "BATCH-2026-DSP-004",
    projectId: "PRJ-D",
    projectName: "Project D",
    motorId: "MTR-S0-315",
    motorType: "0",
    motorStage: "0",
    priority: "High",
    assignedTo: { fullName: "Priya Menon" },
    createdOn: "2026-06-14T08:45:00Z",
    dispatchStatus: OPERATION_STATUS.REJECTED,
    formId: "DSP-FORM-2026-004",
    rejectionReason: "Vehicle inspection observations incomplete.",
  },
];

export const mergeDispatchMockBatches = (apiBatches: DispatchBatch[]): DispatchBatch[] => {
  const mockIds = new Set(MOCK_DISPATCH_BATCHES.map((batch) => batch.batchId));
  const filtered = apiBatches.filter((batch) => !mockIds.has(batch.batchId));
  return [...MOCK_DISPATCH_BATCHES, ...filtered];
};

export const canLoadDispatchForm = (setup: {
  motorStage: string;
  motorId: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
}) => {
  if (!setup.motorStage.trim() || !setup.motorId.trim()) return false;
  if (!setup.castingDate.trim() || !setup.dispatchDate.trim()) return false;
  if (!setup.dispatchLocation.trim()) return false;
  if (!setup.ndtClearance.trim() || !setup.finalAcceptanceClearance.trim()) return false;
  if (setup.ndtClearance === "YES" && !setup.ndtMomNo.trim()) return false;
  if (setup.finalAcceptanceClearance === "YES" && !setup.finalAcceptanceMomNo.trim()) return false;
  return true;
};
