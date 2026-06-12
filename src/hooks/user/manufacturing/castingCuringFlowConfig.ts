import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.CASTING_CURING;

export type CastingCuringMotorOption = {
  value: string;
  label: string;
};

export type CastingCuringAddedMotor = {
  motorId: string;
  motorReceivedAt: string;
};

export const CASTING_TYPE_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Pair", label: "Pair" },
  { value: "Triple", label: "Triple" },
  { value: "Others", label: "Others" },
] as const;

export const resolveCastingMotorCount = (castingType: string, customCount: number | "") => {
  const normalized = String(castingType ?? "").trim().toLowerCase();
  if (normalized === "single") return 1;
  if (normalized === "pair") return 2;
  if (normalized === "triple") return 3;
  return customCount === "" ? 0 : Number(customCount);
};

export const resolveCastingCuringMotorOptions = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
  projectName?: string;
} | null): CastingCuringMotorOption[] => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length > 0) {
    return ids.map((id) => ({ value: id, label: id }));
  }

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return [];

  const parsed = singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (parsed.length > 1) {
    return parsed.map((id) => ({ value: id, label: id }));
  }

  return [{ value: singleId, label: singleId }];
};

export const getCastingMotorCountOptions = (motorOptions: CastingCuringMotorOption[]) =>
  Array.from({ length: Math.max(motorOptions.length, 1) }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));

export const getSelectedCastingDraftMotorIds = (
  count: number,
  draftMotorIds: string[],
): string[] =>
  Array.from({ length: count }, (_, idx) => String(draftMotorIds[idx] ?? "").trim()).filter(Boolean);

export const canStartCastingCuringForm = ({
  castingType,
  castingStation,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  usedMotorIds,
  schemasReady,
  availableMotorOptions,
}: {
  castingType: string;
  castingStation: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  usedMotorIds: string[];
  schemasReady: boolean;
  availableMotorOptions: CastingCuringMotorOption[];
}) => {
  if (schemasReady) return false;
  if (!String(castingType ?? "").trim() || !String(castingStation ?? "").trim()) return false;
  if (!String(motorReceivedAt ?? "").trim()) return false;

  const count = resolveCastingMotorCount(castingType, motorCount);
  if (count <= 0) return false;

  if (availableMotorOptions.length === 0) return true;

  const selectedIds = getSelectedCastingDraftMotorIds(count, draftMotorIds);
  return (
    selectedIds.length === count &&
    new Set(selectedIds).size === count &&
    selectedIds.every((id) => !usedMotorIds.includes(id))
  );
};

export const CASTING_CURING_FLOW_LABELS = {
  castingType: S.FLOW_CASTING_TYPE,
  castingTypePlaceholder: S.FLOW_CASTING_TYPE_PLACEHOLDER,
  castingStation: S.FLOW_CASTING_STATION,
  castingStationPlaceholder: S.FLOW_CASTING_STATION_PLACEHOLDER,
  motorCount: S.FLOW_MOTOR_COUNT,
  motorCountPlaceholder: S.FLOW_MOTOR_COUNT_PLACEHOLDER,
  motorId: S.FLOW_MOTOR_ID,
  motorIdPlaceholder: S.FLOW_MOTOR_ID_PLACEHOLDER,
  motorReceivedAt: S.FLOW_MOTOR_RECEIVED_AT,
  motorReceivedAtPlaceholder: S.FLOW_MOTOR_RECEIVED_AT_PLACEHOLDER,
  startForm: S.FLOW_START_FORM,
  schemaLoading: S.SCHEMA_LOADING,
};

export const resolveMotorStage = (batch?: { motorStage?: unknown; motorType?: unknown } | null) => {
  const stage = batch?.motorStage ?? batch?.motorType;
  if (stage && typeof stage === "object") {
    const record = stage as { motorStageId?: number; id?: number };
    const parsed = Number(record.motorStageId ?? record.id ?? 1);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  const numeric = Number(stage);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return 1;
};
