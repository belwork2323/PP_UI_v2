import {
  buildDispatchSectionPayload,
  createDispatchInitialValues,
  DISPATCH_SCHEMA_TYPE,
  hydrateDispatchValuesFromSections,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export const createDispatchData = () => ({
  motorStage: "",
  motorId: "",
  castingDate: "",
  dispatchDate: "",
  dispatchLocation: "",
  ndtClearance: "",
  ndtMomNo: "",
  finalAcceptanceClearance: "",
  finalAcceptanceMomNo: "",
  schemaFormLoaded: false,
  dispatchSchema: null as SchemaDocumentV2 | null,
  schemaFormValues: {} as SchemaFormValues,
  savedSections: undefined as SchemaSectionSubmission[] | undefined,
});

export type DispatchFormState = ReturnType<typeof createDispatchData>;

export type DispatchDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorStage?: string;
  motorId?: string;
  castingDate?: string;
  dispatchDate?: string;
  dispatchLocation?: string;
  ndtClearance?: string;
  ndtMomNo?: string;
  finalAcceptanceClearance?: string;
  finalAcceptanceMomNo?: string;
  sections?: SchemaSectionSubmission[];
};

export type DispatchFormBody = {
  schemaVersion?: string;
  schemaType?: string;
  motorStage?: string;
  motorId?: string;
  castingDate?: string;
  dispatchDate?: string;
  dispatchLocation?: string;
  ndtClearance?: string;
  ndtMomNo?: string;
  finalAcceptanceClearance?: string;
  finalAcceptanceMomNo?: string;
  sections: SchemaSectionSubmission[];
};

export const createDefaultDispatchFormState = (): DispatchFormState => createDispatchData();

export const hydrateDispatchFormState = (
  state: DispatchFormState,
  schema: SchemaDocumentV2,
): DispatchFormState => ({
  ...state,
  dispatchSchema: schema,
  schemaFormValues: state.savedSections?.length
    ? hydrateDispatchValuesFromSections(schema, state.savedSections)
    : Object.keys(state.schemaFormValues ?? {}).length > 0
      ? state.schemaFormValues
      : createDispatchInitialValues(schema),
  schemaFormLoaded: true,
});

export const mapDispatchDetailsToFormState = (
  details: Partial<DispatchDetails>,
): DispatchFormState => {
  const defaults = createDefaultDispatchFormState();
  const savedSections = Array.isArray(details?.sections) ? details.sections : undefined;

  return {
    ...defaults,
    motorStage: String(details?.motorStage ?? ""),
    motorId: String(details?.motorId ?? ""),
    castingDate: String(details?.castingDate ?? ""),
    dispatchDate: String(details?.dispatchDate ?? ""),
    dispatchLocation: String(details?.dispatchLocation ?? ""),
    ndtClearance: String(details?.ndtClearance ?? ""),
    ndtMomNo: String(details?.ndtMomNo ?? ""),
    finalAcceptanceClearance: String(details?.finalAcceptanceClearance ?? ""),
    finalAcceptanceMomNo: String(details?.finalAcceptanceMomNo ?? ""),
    schemaFormLoaded: Boolean(savedSections?.length),
    savedSections,
  };
};

export const mapDispatchFormStateToPayload = (form: DispatchFormState): DispatchFormBody => {
  const schema = form.dispatchSchema;

  return {
    schemaVersion: schema?.schemaVersion,
    schemaType: schema?.schemaType ?? DISPATCH_SCHEMA_TYPE,
    motorStage: form.motorStage || undefined,
    motorId: form.motorId || undefined,
    castingDate: form.castingDate || undefined,
    dispatchDate: form.dispatchDate || undefined,
    dispatchLocation: form.dispatchLocation || undefined,
    ndtClearance: form.ndtClearance || undefined,
    ndtMomNo: form.ndtClearance === "YES" ? form.ndtMomNo || undefined : undefined,
    finalAcceptanceClearance: form.finalAcceptanceClearance || undefined,
    finalAcceptanceMomNo:
      form.finalAcceptanceClearance === "YES" ? form.finalAcceptanceMomNo || undefined : undefined,
    sections: schema ? buildDispatchSectionPayload(schema, form.schemaFormValues) : [],
  };
};

const hasSetupValue = (form: DispatchFormState) =>
  [
    form.motorStage,
    form.motorId,
    form.castingDate,
    form.dispatchDate,
    form.dispatchLocation,
    form.ndtClearance,
    form.ndtMomNo,
    form.finalAcceptanceClearance,
    form.finalAcceptanceMomNo,
  ].some((value) => String(value ?? "").trim().length > 0);

export const hasAnyDispatchValue = (form: DispatchFormState) =>
  hasSetupValue(form) || schemaValuesHaveUserData(form.schemaFormValues ?? {});
