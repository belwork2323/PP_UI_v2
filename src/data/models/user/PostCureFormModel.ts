import {
  createPostCureData,
  isPostCureInhibitionOperation,
  mapPostCureInhibitorTypeToApi,
  mapPostCureOperationToApi,
} from "../../../hooks/user/manufacturing/postCureConfig";
import {
  buildPostCureSectionPayload,
  createPostCureInitialValues,
  hydratePostCureValuesFromSections,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export type PostCureMotorSession = {
  motorId: string;
  motorReceiptDate: string;
  operation: string;
  inhibitorType: string;
  postCureSchema: SchemaDocumentV2 | null;
  schemaFormValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export type PostCureFormState = ReturnType<typeof createPostCureData>;

export type PostCureDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorId?: string;
  motorReceiptDate?: string;
  operation?: string;
  inhibitorType?: string;
  sections?: SchemaSectionSubmission[];
  motors?: Array<{
    motorId: string;
    motorReceiptDate?: string;
    operation?: string;
    inhibitorType?: string;
    operationType?: string;
    sections?: SchemaSectionSubmission[];
  }>;
};

export type PostCureMotorPayload = {
  motorId: string;
  motorReceiptDate: string;
  operationType: "LOOSE_FLAP_FILLING" | "INHIBITION" | null;
  sections: SchemaSectionSubmission[];
  inhibitorType?: "IR1" | "HEMCOAT_3K" | "NOT_APPLICABLE";
};

export type PostCureFormBody = {
  motors: PostCureMotorPayload[];
};

export const createDefaultPostCureFormState = (): PostCureFormState => createPostCureData();

export const createEmptyPostCureMotorSession = (
  motorId: string,
  motorReceiptDate: string,
  operation: string,
  inhibitorType: string,
  schema: SchemaDocumentV2,
): PostCureMotorSession => ({
  motorId,
  motorReceiptDate,
  operation,
  inhibitorType,
  postCureSchema: schema,
  schemaFormValues: createPostCureInitialValues(schema),
  savedSections: undefined,
});

export const hydratePostCureMotorSession = (
  motor: PostCureMotorSession,
  schema: SchemaDocumentV2,
): PostCureMotorSession => ({
  ...motor,
  postCureSchema: schema,
  schemaFormValues: motor.savedSections?.length
    ? hydratePostCureValuesFromSections(schema, motor.savedSections)
    : Object.keys(motor.schemaFormValues ?? {}).length > 0
      ? motor.schemaFormValues
      : createPostCureInitialValues(schema),
});

const mapApiOperationType = (operationType: string) => {
  if (operationType === "LOOSE_FLAP_FILLING") return "loose-flap-filling";
  if (operationType === "INHIBITION") return "inhibition";
  return "";
};

const mapApiInhibitorType = (inhibitorType: string) => {
  if (inhibitorType === "HEMCOAT_3K") return "Hemcoat-3K";
  if (inhibitorType === "NOT_APPLICABLE") return "not-applicable";
  return inhibitorType;
};

const mapDetailsMotorToSession = (
  motor: {
    motorId?: string;
    motorReceiptDate?: string;
    operation?: string;
    inhibitorType?: string;
    operationType?: string;
    sections?: SchemaSectionSubmission[];
  },
  fallback?: { operation?: string; inhibitorType?: string },
): PostCureMotorSession | null => {
  const motorId = String(motor?.motorId ?? "").trim();
  if (!motorId) return null;

  const operationType = String(motor?.operationType ?? "").trim();
  const operation =
    String(motor?.operation ?? "").trim() ||
    mapApiOperationType(operationType) ||
    String(fallback?.operation ?? "");

  const inhibitorType =
    mapApiInhibitorType(String(motor?.inhibitorType ?? "").trim()) ||
    String(fallback?.inhibitorType ?? "");

  return {
    motorId,
    motorReceiptDate: String(motor?.motorReceiptDate ?? ""),
    operation,
    inhibitorType,
    postCureSchema: null,
    schemaFormValues: {},
    savedSections: Array.isArray(motor?.sections) ? motor.sections : undefined,
  };
};

export const mapPostCureDetailsToFormState = (details: Partial<PostCureDetails>): PostCureFormState => {
  const defaults = createDefaultPostCureFormState();
  const fallback = {
    operation: String(details?.operation ?? ""),
    inhibitorType: mapApiInhibitorType(String(details?.inhibitorType ?? "").trim()),
  };

  const rawMotors = Array.isArray(details?.motors) ? details.motors : [];
  const motors =
    rawMotors.length > 0
      ? rawMotors
          .map((motor) => mapDetailsMotorToSession(motor, fallback))
          .filter((motor): motor is PostCureMotorSession => motor !== null)
      : details?.motorId
        ? [mapDetailsMotorToSession(details, fallback)].filter(
            (motor): motor is PostCureMotorSession => motor !== null,
          )
        : [];

  const hasSavedSections = motors.some((motor) => Boolean(motor.savedSections?.length));

  return {
    ...defaults,
    schemaFormLoaded: hasSavedSections,
    motors,
  };
};

export const mapPostCureFormStateToPayload = (form: PostCureFormState): PostCureFormBody => ({
  motors: (form.motors ?? []).map((motor) => {
    const operationType = mapPostCureOperationToApi(motor.operation);
    const inhibitorType = isPostCureInhibitionOperation(motor.operation)
      ? mapPostCureInhibitorTypeToApi(motor.inhibitorType)
      : null;

    return {
      motorId: String(motor.motorId ?? ""),
      motorReceiptDate: String(motor.motorReceiptDate ?? ""),
      operationType,
      sections: motor.postCureSchema
        ? buildPostCureSectionPayload(motor.postCureSchema, motor.schemaFormValues)
        : [],
      ...(inhibitorType ? { inhibitorType } : {}),
    };
  }),
});

export const hasAnyPostCureValue = (form: PostCureFormState) =>
  (form.motors ?? []).some(
    (motor) =>
      [motor.motorId, motor.motorReceiptDate, motor.operation, motor.inhibitorType].some(
        (value) => String(value ?? "").trim().length > 0,
      ) || schemaValuesHaveUserData(motor.schemaFormValues ?? {}),
  );

export class PostCureSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.status ?? "");
  }

  static fromApi(data: any) {
    return new PostCureSubmitResponseModel(data);
  }
}

export class PostCureDetailsModel {
  static fromApi(data: any): PostCureDetails {
    const payload = data?.data ?? data ?? {};
    const operationType = String(payload?.operationType ?? "").trim();
    const inhibitorType = String(payload?.inhibitorType ?? "").trim();

    const operation = mapApiOperationType(operationType) || String(payload?.operation ?? "");
    const mappedInhibitorType = mapApiInhibitorType(inhibitorType) || String(payload?.inhibitorType ?? "");

    const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      motorId: String(payload?.motorId ?? ""),
      motorReceiptDate: String(payload?.motorReceiptDate ?? ""),
      operation,
      inhibitorType: mappedInhibitorType,
      sections: Array.isArray(payload?.sections) ? payload.sections : undefined,
      motors:
        rawMotors.length > 0
          ? rawMotors.map((motor: any) => ({
              motorId: String(motor?.motorId ?? ""),
              motorReceiptDate: String(motor?.motorReceiptDate ?? ""),
              operation: mapApiOperationType(String(motor?.operationType ?? "")) || operation,
              inhibitorType:
                mapApiInhibitorType(String(motor?.inhibitorType ?? "")) || mappedInhibitorType,
              operationType: String(motor?.operationType ?? ""),
              sections: Array.isArray(motor?.sections) ? motor.sections : undefined,
            }))
          : undefined,
    };
  }
}
