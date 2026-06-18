import {
  buildStfSectionPayload,
  createStfInitialValues,
  hydrateStfValuesFromSections,
  mapStfSubType,
  schemaValuesHaveUserData,
  STF_SCHEMA_TYPE,
  type StfSubType,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export type { StfSubType };

export const createStfData = () => ({
  schemaFormLoaded: false,
  subType: null as StfSubType | null,
  motorIdNo: "",
  stfSchema: null as SchemaDocumentV2 | null,
  schemasBySubType: {} as Partial<Record<StfSubType, SchemaDocumentV2>>,
  schemaFormValues: {} as SchemaFormValues,
  savedSections: undefined as SchemaSectionSubmission[] | undefined,
});

export type StaticTestFacilityFormState = ReturnType<typeof createStfData>;

export type StaticTestFacilityDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  subType?: StfSubType | string | null;
  motorIdNo?: string | null;
  sections?: SchemaSectionSubmission[];
};

export type StaticTestFacilityFormBody = {
  schemaVersion?: string;
  schemaType?: string;
  subType?: StfSubType;
  motorIdNo?: string;
  sections: SchemaSectionSubmission[];
};

export const createDefaultStaticTestFacilityFormState = (): StaticTestFacilityFormState =>
  createStfData();

export const hydrateStaticTestFacilityFormState = (
  state: StaticTestFacilityFormState,
  schema: SchemaDocumentV2,
  subType: StfSubType,
): StaticTestFacilityFormState => ({
  ...state,
  subType,
  stfSchema: schema,
  schemasBySubType: {
    ...(state.schemasBySubType ?? {}),
    [subType]: schema,
  },
  schemaFormValues: state.savedSections?.length
    ? hydrateStfValuesFromSections(schema, state.savedSections)
    : Object.keys(state.schemaFormValues ?? {}).length > 0
      ? state.schemaFormValues
      : createStfInitialValues(schema),
  schemaFormLoaded: true,
});

export const mapStaticTestFacilityDetailsToFormState = (
  details: Partial<StaticTestFacilityDetails>,
): StaticTestFacilityFormState => {
  const defaults = createDefaultStaticTestFacilityFormState();
  const savedSections = Array.isArray(details?.sections) ? details.sections : undefined;
  const subType = details?.subType ? mapStfSubType(details.subType) : null;

  return {
    ...defaults,
    subType,
    motorIdNo: String(details?.motorIdNo ?? ""),
    schemaFormLoaded: Boolean(savedSections?.length),
    savedSections,
  };
};

export const mapStaticTestFacilityFormStateToPayload = (
  form: StaticTestFacilityFormState,
): StaticTestFacilityFormBody => {
  const schema = form.stfSchema;

  return {
    schemaVersion: schema?.schemaVersion,
    schemaType: schema?.schemaType ?? STF_SCHEMA_TYPE,
    subType: form.subType ?? undefined,
    motorIdNo: form.motorIdNo?.trim() || undefined,
    sections: schema ? buildStfSectionPayload(schema, form.schemaFormValues) : [],
  };
};

export const hasAnyStaticTestFacilityValue = (form: StaticTestFacilityFormState) =>
  schemaValuesHaveUserData(form.schemaFormValues ?? {});
