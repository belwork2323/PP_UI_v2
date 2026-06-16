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

export type PostCureSetupState = {
  motorId: string;
  motorReceiptDate: string;
  operation: string;
  inhibitorType: string;
};

export type PostCureFormState = ReturnType<typeof createPostCureData>;

export type PostCureDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorId: string;
  motorReceiptDate?: string;
  operation?: string;
  inhibitorType?: string;
  sections?: SchemaSectionSubmission[];
};

export const createDefaultPostCureFormState = (): PostCureFormState => createPostCureData();

export const mapPostCureDetailsToFormState = (details: Partial<PostCureDetails>): PostCureFormState => {
  const defaults = createDefaultPostCureFormState();

  return {
    ...defaults,
    motorId: String(details?.motorId ?? defaults.motorId),
    motorReceiptDate: String(details?.motorReceiptDate ?? defaults.motorReceiptDate),
    operation: String(details?.operation ?? defaults.operation),
    inhibitorType: String(details?.inhibitorType ?? defaults.inhibitorType),
    schemaFormLoaded: Boolean(details?.sections?.length),
    savedSections: details?.sections,
  };
};

export const mapPostCureFormStateToPayload = (
  form: PostCureFormState,
  schema: SchemaDocumentV2 | null,
) => {
  const operationType = mapPostCureOperationToApi(form.operation);
  const inhibitorType = isPostCureInhibitionOperation(form.operation)
    ? mapPostCureInhibitorTypeToApi(form.inhibitorType)
    : null;

  const payload: Record<string, unknown> = {
    motorId: String(form.motorId ?? ""),
    motorReceiptDate: String(form.motorReceiptDate ?? ""),
    operationType,
    sections: schema ? buildPostCureSectionPayload(schema, form.schemaFormValues) : [],
  };

  if (inhibitorType) {
    payload.inhibitorType = inhibitorType;
  }

  return payload;
};

export const hasAnyPostCureValue = (form: PostCureFormState) => {
  const setupFilled = [form.motorId, form.motorReceiptDate, form.operation, form.inhibitorType].some(
    (value) => String(value ?? "").trim().length > 0,
  );
  const schemaFilled = schemaValuesHaveUserData(form.schemaFormValues ?? {});
  return setupFilled || schemaFilled;
};

export const hydratePostCureFormWithSchema = (
  form: PostCureFormState,
  schema: SchemaDocumentV2,
): PostCureFormState => ({
  ...form,
  postCureSchema: schema,
  schemaFormLoaded: true,
  schemaFormValues: form.savedSections?.length
    ? hydratePostCureValuesFromSections(schema, form.savedSections)
    : createPostCureInitialValues(schema),
});

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

    const operation =
      operationType === "LOOSE_FLAP_FILLING"
        ? "loose-flap-filling"
        : operationType === "INHIBITION"
          ? "inhibition"
          : String(payload?.operation ?? "");

    const mappedInhibitorType =
      inhibitorType === "HEMCOAT_3K"
        ? "Hemcoat-3K"
        : inhibitorType === "NOT_APPLICABLE"
          ? "not-applicable"
          : inhibitorType || String(payload?.inhibitorType ?? "");

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
    };
  }
}
