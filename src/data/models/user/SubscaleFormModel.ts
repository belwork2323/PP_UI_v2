import {
  buildSubscaleSectionPayload,
  createSubscaleInitialValues,
  hydrateSubscaleValuesFromSections,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export const createSubscaleData = () => ({
  schemaFormLoaded: false,
  subscaleSchema: null as SchemaDocumentV2 | null,
  schemaFormValues: {} as SchemaFormValues,
  savedSections: undefined as SchemaSectionSubmission[] | undefined,
});

export type SubscaleFormState = ReturnType<typeof createSubscaleData>;

export type SubscaleDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  sections?: SchemaSectionSubmission[];
};

export type SubscaleFormBody = {
  sections: SchemaSectionSubmission[];
};

export const createDefaultSubscaleFormState = (): SubscaleFormState => createSubscaleData();

export const hydrateSubscaleFormState = (
  state: SubscaleFormState,
  schema: SchemaDocumentV2,
): SubscaleFormState => ({
  ...state,
  subscaleSchema: schema,
  schemaFormValues: state.savedSections?.length
    ? hydrateSubscaleValuesFromSections(schema, state.savedSections)
    : Object.keys(state.schemaFormValues ?? {}).length > 0
      ? state.schemaFormValues
      : createSubscaleInitialValues(schema),
});

export const mapSubscaleDetailsToFormState = (details: Partial<SubscaleDetails>): SubscaleFormState => {
  const defaults = createDefaultSubscaleFormState();
  const savedSections = Array.isArray(details?.sections) ? details.sections : undefined;

  return {
    ...defaults,
    schemaFormLoaded: Boolean(savedSections?.length),
    savedSections,
  };
};

export const mapSubscaleFormStateToPayload = (form: SubscaleFormState): SubscaleFormBody => ({
  sections: form.subscaleSchema
    ? buildSubscaleSectionPayload(form.subscaleSchema, form.schemaFormValues)
    : [],
});

export const hasAnySubscaleValue = (form: SubscaleFormState) =>
  schemaValuesHaveUserData(form.schemaFormValues ?? {});

export class SubscaleSubmitResponseModel {
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
    return new SubscaleSubmitResponseModel(data);
  }
}

export class SubscaleDetailsModel {
  static fromApi(data: any): SubscaleDetails {
    const payload = data?.data ?? data ?? {};

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      sections: Array.isArray(payload?.sections) ? payload.sections : undefined,
    };
  }
}
