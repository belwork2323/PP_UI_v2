import type { SchemaDocument, SchemaFormValues, SchemaSectionSubmission } from "../../../schemaManagement";
import {
  buildCastingCuringSectionPayload,
  createCastingCuringInitialValues,
  hydrateCastingCuringValuesFromSections,
} from "../../../schemaManagement";
import { schemaValuesHaveUserData } from "../../../schemaManagement/models/schemaFormState";

export type CastingCuringMotorSession = {
  motorId: string;
  motorReceivedAt: string;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export type CastingCuringFormState = {
  castingType: string;
  castingStation: string;
  castingSchema: SchemaDocument | null;
  curingSchema: SchemaDocument | null;
  motors: CastingCuringMotorSession[];
  curingFormValues: SchemaFormValues;
  curingSavedSections?: SchemaSectionSubmission[];
};

export type CastingCuringFormBody = {
  schemaVersion?: string;
  setup: {
    castingType: string;
    castingStation: string;
  };
  motors: Array<{
    motorId: string;
    motorReceivedAt: string;
    sections: SchemaSectionSubmission[];
  }>;
  curingSections: SchemaSectionSubmission[];
};

export const createDefaultCastingCuringFormState = (): CastingCuringFormState => ({
  castingType: "",
  castingStation: "",
  castingSchema: null,
  curingSchema: null,
  motors: [],
  curingFormValues: {},
});

export const createEmptyMotorSession = (
  motorId: string,
  motorReceivedAt: string,
  schema: SchemaDocument | null,
): CastingCuringMotorSession => ({
  motorId,
  motorReceivedAt,
  formValues: schema ? createCastingCuringInitialValues(schema) : {},
  savedSections: undefined,
});

const resolveDetailsPayload = (details: any) =>
  details?.castingCuringDetails ?? details?.preparationDetails ?? details ?? {};

export const mapCastingCuringDetailsToFormState = (details: any): CastingCuringFormState => {
  const payload = resolveDetailsPayload(details);
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

  const motors = rawMotors
    .map((motor: any) => ({
      motorId: String(motor?.motorId ?? "").trim(),
      motorReceivedAt: String(motor?.motorReceivedAt ?? motor?.motorReceivedDate ?? "").trim(),
      formValues: {},
      savedSections: Array.isArray(motor?.sections) ? motor.sections : undefined,
    }))
    .filter((motor) => motor.motorId.length > 0);

  const curingSections = Array.isArray(payload?.curingSections)
    ? payload.curingSections
    : Array.isArray(payload?.sections)
      ? payload.sections
      : undefined;

  return {
    castingType: String(payload?.setup?.castingType ?? payload?.castingType ?? ""),
    castingStation: String(payload?.setup?.castingStation ?? payload?.castingStation ?? ""),
    castingSchema: null,
    curingSchema: null,
    motors,
    curingFormValues: {},
    curingSavedSections: curingSections,
  };
};

export const hydrateCastingCuringFormState = (
  state: CastingCuringFormState,
  castingSchema: SchemaDocument | null,
  curingSchema: SchemaDocument | null,
): CastingCuringFormState => {
  const motors = (state.motors ?? []).map((motor) => ({
    ...motor,
    formValues: castingSchema
      ? motor.savedSections?.length
        ? hydrateCastingCuringValuesFromSections(castingSchema, motor.savedSections)
        : Object.keys(motor.formValues ?? {}).length > 0
          ? motor.formValues
          : createCastingCuringInitialValues(castingSchema)
      : motor.formValues,
  }));

  const curingFormValues = curingSchema
    ? state.curingSavedSections?.length
      ? hydrateCastingCuringValuesFromSections(curingSchema, state.curingSavedSections)
      : Object.keys(state.curingFormValues ?? {}).length > 0
        ? state.curingFormValues
        : createCastingCuringInitialValues(curingSchema)
    : state.curingFormValues;

  return {
    ...state,
    castingSchema,
    curingSchema,
    motors,
    curingFormValues,
  };
};

export const mapCastingCuringFormStateToPayload = (
  form: CastingCuringFormState,
): CastingCuringFormBody => {
  const castingSchema = form.castingSchema;
  const curingSchema = form.curingSchema;

  return {
    schemaVersion: curingSchema?.schemaVersion ?? castingSchema?.schemaVersion,
    setup: {
      castingType: String(form.castingType ?? ""),
      castingStation: String(form.castingStation ?? ""),
    },
    motors: castingSchema
      ? (form.motors ?? []).map((motor) => ({
          motorId: motor.motorId,
          motorReceivedAt: motor.motorReceivedAt,
          sections: buildCastingCuringSectionPayload(castingSchema, motor.formValues),
        }))
      : [],
    curingSections: curingSchema
      ? buildCastingCuringSectionPayload(curingSchema, form.curingFormValues)
      : [],
  };
};

export const hasAnyCastingCuringValue = (form: CastingCuringFormState) => {
  if (String(form.castingType ?? "").trim() || String(form.castingStation ?? "").trim()) {
    return true;
  }

  if ((form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.formValues ?? {}))) {
    return true;
  }

  return schemaValuesHaveUserData(form.curingFormValues ?? {});
};

export class CastingCuringSubmitResponseModel {
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
    return new CastingCuringSubmitResponseModel(data);
  }
}

export class CastingCuringDetailsModel {
  static fromApi(data: any) {
    const payload = data?.data ?? data ?? {};
    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      castingCuringDetails: payload?.castingCuringDetails ?? payload,
    };
  }
}
