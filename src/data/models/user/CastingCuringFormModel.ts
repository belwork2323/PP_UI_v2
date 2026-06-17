import type {
  SchemaDocumentV2,
  SchemaFormValues,
  SchemaSectionSubmission,
  SchemaSetupContext,
} from "../../../schema-engine";
import {
  buildCastingCuringSectionPayload,
  createCastingCuringInitialValues,
  hydrateCastingCuringValuesFromSections,
  buildCastingSetupContext,
  schemaValuesHaveUserData,
} from "../../../schema-engine";
import type { CuringProjectStageMatrix } from "./curingProjectStageMatrix";

export type CastingProcessSetup = {
  initialVacuum: string;
  castingVacuumPressure: string;
  soakingVacuumPressure: string;
  finalMixCount: string;
};

export type CuringProcessSetup = {
  oven: string;
  curingType: string;
  configuration: string;
  motorsToCureCount: number | "";
  ovensUtilized: string;
};

export type CastingCuringMotorSession = {
  motorId: string;
  motorReceivedAt: string;
  formValues: SchemaFormValues;
  curingSetup: CuringProcessSetup;
  curingFormLoaded?: boolean;
  curingFormValues?: SchemaFormValues;
  curingProjectStageMatrix?: CuringProjectStageMatrix;
  savedSections?: SchemaSectionSubmission[];
  curingSavedSections?: SchemaSectionSubmission[];
};

export type CastingCuringFormState = {
  castingType: string;
  castingStation: string;
  castingSetup: CastingProcessSetup;
  castingFormLoaded: boolean;
  readyForCuring: boolean;
  castingSchema: SchemaDocumentV2 | null;
  curingSchema: SchemaDocumentV2 | null;
  motors: CastingCuringMotorSession[];
  curingFormValues: SchemaFormValues;
  curingSavedSections?: SchemaSectionSubmission[];
};

export type CastingCuringFormBody = {
  motors: Array<{
    motorId: string;
    motorReceivedAt: string;
    setup: {
      castingType: string;
      castingStation: string;
      initialVacuum: string;
      castingVacuumPressure: string;
      soakingVacuumPressure: string;
      finalMixCount: string;
    };
    curingSetup: {
      oven: string;
      curingType: string;
      configuration: string;
      motorsToCureCount: number | "";
      ovensUtilized: string;
    };
    castingSections: SchemaSectionSubmission[];
    curingSections: SchemaSectionSubmission[];
  }>;
};

export const createDefaultCastingProcessSetup = (): CastingProcessSetup => ({
  initialVacuum: "",
  castingVacuumPressure: "",
  soakingVacuumPressure: "",
  finalMixCount: "",
});

export const createDefaultCuringProcessSetup = (): CuringProcessSetup => ({
  oven: "",
  curingType: "",
  configuration: "",
  motorsToCureCount: "",
  ovensUtilized: "",
});

export const createDefaultCastingCuringFormState = (): CastingCuringFormState => ({
  castingType: "",
  castingStation: "",
  castingSetup: createDefaultCastingProcessSetup(),
  castingFormLoaded: false,
  readyForCuring: false,
  castingSchema: null,
  curingSchema: null,
  motors: [],
  curingFormValues: {},
});

export const createEmptyMotorSession = (
  motorId: string,
  motorReceivedAt: string,
  schema: SchemaDocumentV2 | null,
  setupContext?: SchemaSetupContext,
): CastingCuringMotorSession => ({
  motorId,
  motorReceivedAt,
  formValues: schema ? createCastingCuringInitialValues(schema, setupContext) : {},
  curingSetup: createDefaultCuringProcessSetup(),
  curingFormLoaded: false,
  savedSections: undefined,
});

export const mapCastingCuringDetailsToFormState = (details: any): CastingCuringFormState => {
  const payload = details?.castingCuringDetails ?? details?.preparationDetails ?? details ?? {};
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

  const extractMotorData = (motor: any) => {
    const src = motor?.details ?? motor;
    return {
      motorId: String(motor?.motorId ?? src?.motorId ?? "").trim(),
      motorReceivedAt: String(src?.motorReceivedAt ?? motor?.motorReceivedAt ?? "").trim(),
      formValues: {},
      curingSetup: {
        oven: String(motor?.curingSetup?.oven ?? ""),
        curingType: String(motor?.curingSetup?.curingType ?? ""),
        configuration: String(motor?.curingSetup?.configuration ?? ""),
        motorsToCureCount: Number(motor?.curingSetup?.motorsToCureCount ?? "") || "",
        ovensUtilized: String(motor?.curingSetup?.ovensUtilized ?? ""),
      },
      curingFormLoaded: Boolean(
        String(motor?.curingSetup?.oven ?? "").trim() &&
        String(motor?.curingSetup?.curingType ?? "").trim() &&
        String(motor?.curingSetup?.configuration ?? "").trim() &&
        String(motor?.curingSetup?.ovensUtilized ?? "").trim(),
      ),
      savedSections: Array.isArray(motor?.sections)
        ? motor.sections
        : Array.isArray(motor?.castingSections)
          ? motor.castingSections
          : undefined,
      curingSavedSections: Array.isArray(motor?.curingSections) ? motor.curingSections : undefined,
      curingProjectStageMatrix: motor?.curingProjectStageMatrix ?? undefined,
    };
  };

  const motors = rawMotors.map(extractMotorData).filter((motor) => motor.motorId.length > 0);

const curingSections = Array.isArray(payload?.curingSections)
  ? payload.curingSections
  : motors.find((motor) => Array.isArray(motor.curingSavedSections))?.curingSavedSections;

const firstMotorSetup = rawMotors.find((m: any) => m?.setup)?.setup ?? {};

return {
  castingType: String(
    payload?.setup?.castingType ?? payload?.castingType ?? firstMotorSetup?.castingType ?? "",
  ),
  castingStation: String(
    payload?.setup?.castingStation ?? payload?.castingStation ?? firstMotorSetup?.castingStation ?? "",
  ),
  castingSetup: {
    initialVacuum: String(
      payload?.setup?.initialVacuum ?? payload?.initialVacuum ?? firstMotorSetup?.initialVacuum ?? "",
    ),
    castingVacuumPressure: String(
      payload?.setup?.castingVacuumPressure ??
        payload?.castingVacuumPressure ??
        firstMotorSetup?.castingVacuumPressure ??
        "",
    ),
    soakingVacuumPressure: String(
      payload?.setup?.soakingVacuumPressure ??
        payload?.soakingVacuumPressure ??
        firstMotorSetup?.soakingVacuumPressure ??
        "",
    ),
    finalMixCount: String(
      payload?.setup?.finalMixCount ?? payload?.finalMixCount ?? firstMotorSetup?.finalMixCount ?? "",
    ),
  },
  castingFormLoaded: motors.length > 0,
  readyForCuring: Boolean(curingSections?.length),
  castingSchema: null,
  curingSchema: null,
  motors,
  curingFormValues: {},
  curingSavedSections: curingSections,
};
};

export const hydrateCastingCuringFormState = (
  state: CastingCuringFormState,
  castingSchema: SchemaDocumentV2 | null,
  curingSchema: SchemaDocumentV2 | null,
): CastingCuringFormState => {
  const setupContext = buildCastingSetupContext(state.castingSetup);
  const motors = (state.motors ?? []).map((motor) => ({
    ...motor,
    curingSetup: motor.curingSetup ?? createDefaultCuringProcessSetup(),
    curingFormLoaded: Boolean(motor.curingFormLoaded),
    curingFormValues:
      curingSchema && motor.curingFormLoaded
        ? motor.curingSavedSections?.length
          ? hydrateCastingCuringValuesFromSections(curingSchema, motor.curingSavedSections, setupContext)
          : Object.keys(motor.curingFormValues ?? {}).length > 0
            ? motor.curingFormValues
            : createCastingCuringInitialValues(curingSchema, setupContext)
        : motor.curingFormValues,
    formValues: castingSchema
      ? motor.savedSections?.length
        ? hydrateCastingCuringValuesFromSections(castingSchema, motor.savedSections, setupContext)
        : Object.keys(motor.formValues ?? {}).length > 0
          ? motor.formValues
          : createCastingCuringInitialValues(castingSchema, setupContext)
      : motor.formValues,
  }));

  const curingFormValues = curingSchema
    ? state.curingSavedSections?.length
      ? hydrateCastingCuringValuesFromSections(curingSchema, state.curingSavedSections, setupContext)
      : Object.keys(state.curingFormValues ?? {}).length > 0
        ? state.curingFormValues
        : createCastingCuringInitialValues(curingSchema, setupContext)
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
    motors: castingSchema
      ? (form.motors ?? []).map((motor) => ({
        motorId: motor.motorId,
        motorReceivedAt: motor.motorReceivedAt,
        setup: {
          castingType: String(form.castingType ?? ""),
          castingStation: String(form.castingStation ?? ""),
          initialVacuum: String(form.castingSetup?.initialVacuum ?? ""),
          castingVacuumPressure: String(form.castingSetup?.castingVacuumPressure ?? ""),
          soakingVacuumPressure: String(form.castingSetup?.soakingVacuumPressure ?? ""),
          finalMixCount: String(form.castingSetup?.finalMixCount ?? ""),
        },
        curingSetup: {
          oven: String(motor.curingSetup?.oven ?? ""),
          curingType: String(motor.curingSetup?.curingType ?? ""),
          configuration: String(motor.curingSetup?.configuration ?? ""),
          motorsToCureCount: motor.curingSetup?.motorsToCureCount ?? "",
          ovensUtilized: String(motor.curingSetup?.ovensUtilized ?? ""),
        },
        castingSections: buildCastingCuringSectionPayload(castingSchema, motor.formValues),
        curingSections: curingSchema
          ? buildCastingCuringSectionPayload(curingSchema, motor.curingFormValues ?? form.curingFormValues)
          : [],
      }))
      : [],
  };
};

export const hasAnyCastingCuringValue = (form: CastingCuringFormState) => {
  if (String(form.castingType ?? "").trim() || String(form.castingStation ?? "").trim()) {
    return true;
  }

  if (
    String(form.castingSetup?.initialVacuum ?? "").trim() ||
    String(form.castingSetup?.castingVacuumPressure ?? "").trim() ||
    String(form.castingSetup?.soakingVacuumPressure ?? "").trim() ||
    String(form.castingSetup?.finalMixCount ?? "").trim()
  ) {
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

export type CastingCuringMotorDetail = {
  motorId: string;
  motorStage?: number;
  motorReceivedAt?: string;
  setup?: { castingType: string; castingStation: string; initialVacuum?: string; castingVacuumPressure?: string; soakingVacuumPressure?: string; finalMixCount?: string };
  curingSetup?: { oven: string; curingType: string; configuration: string; motorsToCureCount: number | ""; ovensUtilized: string };
  castingConfiguration?: Record<string, any>;
  castingDetails?: Record<string, any>;
  curingConfiguration?: Record<string, any>;
  curingDetails?: Record<string, any>;
  castingSections?: any[];
  curingSections?: any[];
};

export type CastingCuringFormDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  status?: string;
  project?: { projectId: string; projectName: string };
  motors: CastingCuringMotorDetail[];
  createdBy?: string;
  createdAt?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
};

export class CastingCuringDetailsModel {
  static fromApi(data: any): CastingCuringFormDetails {
    const payload = data?.data ?? data ?? {};
    const details = payload.castingCuringDetails ?? payload.preparationDetails ?? payload;
    const rawMotors = Array.isArray(details?.motors) ? details.motors : [];

    const formatSub = (sub: any) => {
      if (!sub) return "";
      if (typeof sub === "string") return sub;
      return String(sub?.fullName ?? sub?.name ?? sub?._id ?? "");
    };

    const formatDate = (d: any) => {
      if (!d) return "";
      if (typeof d === "string") return d;
      if (d?.$date) return new Date(d.$date).toISOString();
      return String(d);
    };

    return {
      formId: String(details?.formId ?? payload?.formId ?? ""),
      batchId: String(details?.batchId ?? payload?.batchId ?? ""),
      subDepartmentId: Number(details?.subDepartmentId ?? payload?.subDepartmentId ?? 0),
      formSubmissionType: String(details?.formSubmissionType ?? payload?.formSubmissionType ?? ""),
      status: String(details?.status ?? payload?.status ?? ""),
      project: details?.project ?? payload?.project
        ? {
          projectId: String((details?.project ?? payload?.project)?.projectId ?? ""),
          projectName: String((details?.project ?? payload?.project)?.projectName ?? ""),
        }
        : undefined,
      motors: rawMotors.map((m: any) => {
        const src = m?.details ?? m;
        const setup = src?.setup ?? {};
        return {
          motorId: String(m.motorId ?? src?.motorId ?? ""),
          motorStage: (m.motorStage ?? src?.motorStage) != null ? Number(m.motorStage ?? src?.motorStage) : undefined,
          motorReceivedAt: String(src?.motorReceivedAt ?? ""),
          setup: {
            castingType: String(setup?.castingType ?? ""),
            castingStation: String(setup?.castingStation ?? ""),
            initialVacuum: String(setup?.initialVacuum ?? ""),
            castingVacuumPressure: String(setup?.castingVacuumPressure ?? ""),
            soakingVacuumPressure: String(setup?.soakingVacuumPressure ?? ""),
            finalMixCount: String(setup?.finalMixCount ?? ""),
          },
          curingSetup: src.curingSetup ?? undefined,
          castingConfiguration: src.castingConfiguration ?? undefined,
          castingDetails: src.castingDetails ?? undefined,
          curingConfiguration: src.curingConfiguration ?? undefined,
          curingDetails: src.curingDetails ?? undefined,
          castingSections: Array.isArray(src?.castingSections) ? src.castingSections : undefined,
          curingSections: Array.isArray(src?.curingSections) ? src.curingSections : undefined,
        };
      }),
      createdBy: formatSub(details?.submittedBy ?? payload?.submittedBy),
      createdAt: formatDate(details?.submittedAt ?? payload?.submittedAt),
      lastUpdatedBy: formatSub(details?.updatedBy ?? payload?.updatedBy),
      lastUpdatedAt: formatDate(details?.updatedAt ?? payload?.updatedAt),
    };
  }
}
