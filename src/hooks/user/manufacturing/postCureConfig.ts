import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.POST_CURE;

export const POST_CURE_OP_TYPE_CONFIG: Record<string, { color: string; italic?: boolean }> = {
  demoulding: { color: "#6D4C41" },
  "x-ray inspection": { color: "#1565C0" },
  "dimensional check": { color: "#4A235A" },
  "weight measurement": { color: "#0E6655" },
  "full process": { color: "#1B4F72" },
  "not selected yet": { color: "#616A6B", italic: true },
};

export const getOpTypeCfg = (value: string) =>
  POST_CURE_OP_TYPE_CONFIG[String(value ?? "").toLowerCase()] ?? { color: "#555" };

export const POST_CURE_OP_TYPE_OPTIONS = [
  "Demoulding",
  "X-Ray Inspection",
  "Dimensional Check",
  "Weight Measurement",
  "Full Process",
  "Not Selected Yet",
];

export const POST_CURE_OPERATION_LOOSE_FLAP = "loose-flap-filling";
export const POST_CURE_OPERATION_INHIBITION = "inhibition";

export const POST_CURE_OPERATION_OPTIONS = [
  { value: POST_CURE_OPERATION_LOOSE_FLAP, label: S.OPERATION_LOOSE_FLAP_FILLING },
  { value: POST_CURE_OPERATION_INHIBITION, label: S.OPERATION_INHIBITION },
];

export const POST_CURE_INHIBITOR_TYPE_OPTIONS = [
  { value: "IR1", label: "IR1" },
  { value: "Hemcoat-3K", label: "Hemcoat-3K" },
  { value: "not-applicable", label: S.INHIBITOR_TYPE_NOT_APPLICABLE },
];

export type PostCureMotorOption = {
  value: string;
  label: string;
};

export const resolvePostCureMotorOptions = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
} | null): PostCureMotorOption[] => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length > 0) {
    return ids.map((id) => ({ value: id, label: id }));
  }

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return [];

  return singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ({ value: id, label: id }));
};

export const isPostCureInhibitionOperation = (operation: string) =>
  String(operation ?? "").toLowerCase() === POST_CURE_OPERATION_INHIBITION;

export const mapPostCureOperationToApi = (operation: string): "LOOSE_FLAP_FILLING" | "INHIBITION" | null => {
  const normalized = String(operation ?? "").trim().toLowerCase();
  if (normalized === POST_CURE_OPERATION_LOOSE_FLAP) return "LOOSE_FLAP_FILLING";
  if (normalized === POST_CURE_OPERATION_INHIBITION) return "INHIBITION";
  return null;
};

export const mapPostCureInhibitorTypeToApi = (
  inhibitorType: string,
): "IR1" | "HEMCOAT_3K" | "NOT_APPLICABLE" | null => {
  const normalized = String(inhibitorType ?? "").trim();
  if (normalized === "IR1") return "IR1";
  if (normalized === "Hemcoat-3K") return "HEMCOAT_3K";
  if (normalized === "not-applicable") return "NOT_APPLICABLE";
  return null;
};

export const canLoadPostCureForm = ({
  motorId,
  motorReceiptDate,
  operation,
  inhibitorType,
  schemaFormLoaded,
}: {
  motorId: string;
  motorReceiptDate: string;
  operation: string;
  inhibitorType: string;
  schemaFormLoaded: boolean;
}) => {
  if (schemaFormLoaded) return false;
  if (!String(motorId ?? "").trim()) return false;
  if (!String(motorReceiptDate ?? "").trim()) return false;
  if (!mapPostCureOperationToApi(operation)) return false;
  if (isPostCureInhibitionOperation(operation) && !mapPostCureInhibitorTypeToApi(inhibitorType)) {
    return false;
  }
  return true;
};

export const createPostCureData = () => ({
  motorId: "",
  motorReceiptDate: "",
  operation: "",
  inhibitorType: "",
  schemaFormLoaded: false,
  postCureSchema: null as import("../../../schema-engine").SchemaDocumentV2 | null,
  schemaFormValues: {} as import("../../../schema-engine").SchemaFormValues,
  savedSections: undefined as import("../../../schema-engine").SchemaSectionSubmission[] | undefined,
});

const SETUP_FIELDS = ["motorId", "motorReceiptDate", "operation", "inhibitorType"] as const;

export const countPostCureFilled = (data: Record<string, unknown>) =>
  SETUP_FIELDS.filter((key) => String(data[key] ?? "").trim() !== "").length;

export const countPostCureTotal = () => SETUP_FIELDS.length;
