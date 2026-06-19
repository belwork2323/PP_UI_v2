import {
  buildQcSectionPayload,
  createQcInitialValues,
  hydrateQcValuesFromSections,
  QC_SCHEMA_TYPE,
  type QcApiDivision,
  type QcApiSubType,
} from "../../../schema-engine/adapters/qc.adapter";
import { getQcSchemaCacheKey } from "../../../hooks/user/qualityControl/qcFlowConfig";
import type { QcProcessingSlot } from "../../../hooks/user/qualityControl/qcProcessingConfig";
import {
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export type QcPremixEntry = {
  premixNo: number;
};

/** @deprecated Use QcPremixEntry */
export type QcSolidPremixEntry = QcPremixEntry;

export type QualityControlFormState = {
  schemaFormLoaded: boolean;
  division: QcApiDivision | null;
  subType: QcApiSubType;
  qcSchema: SchemaDocumentV2 | null;
  schemasByKey: Partial<Record<string, SchemaDocumentV2>>;
  schemaFormValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  solidPremixEntries?: QcPremixEntry[];
  solidPremixValuesByNo?: Record<number, SchemaFormValues>;
  liquidPremixEntries?: QcPremixEntry[];
  liquidPremixValuesByNo?: Record<number, SchemaFormValues>;
};

export type QualityControlDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  division?: QcApiDivision | string | null;
  subType?: QcApiSubType | string | null;
  sections?: SchemaSectionSubmission[];
};

export const createDefaultQualityControlFormState = (): QualityControlFormState => ({
  schemaFormLoaded: false,
  division: null,
  subType: null,
  qcSchema: null,
  schemasByKey: {},
  schemaFormValues: {},
  savedSections: undefined,
  solidPremixEntries: [],
  solidPremixValuesByNo: {},
  liquidPremixEntries: [],
  liquidPremixValuesByNo: {},
});

export const getProcessingSchemaFromFormState = (
  form: QualityControlFormState,
  slot: QcProcessingSlot,
): SchemaDocumentV2 | null => {
  const key = getQcSchemaCacheKey("RAW_MATERIAL_PROCESSING", slot);
  return form.schemasByKey?.[key] ?? (form.subType === slot ? form.qcSchema : null);
};

const hydratePremixStateFromSections = (
  schema: SchemaDocumentV2,
  savedSections: SchemaSectionSubmission[] | undefined,
  processingSubType: QcProcessingSlot,
  formSubType?: QcApiSubType,
): Pick<QualityControlFormState, "solidPremixEntries" | "solidPremixValuesByNo"> => {
  const premixSections = (savedSections ?? []).filter((section) => {
    if (section.premixNo == null) return false;
    if (section.subType) return section.subType === processingSubType;
    return formSubType === processingSubType || (!formSubType && processingSubType === "SOLID_PROCESSING");
  });

  if (!premixSections.length) {
    return { solidPremixEntries: [], solidPremixValuesByNo: {} };
  }

  const solidPremixEntries: QcPremixEntry[] = [];
  const solidPremixValuesByNo: Record<number, SchemaFormValues> = {};

  premixSections.forEach((section) => {
    const premixNo = Number(section.premixNo);
    if (!premixNo) return;
    if (!solidPremixEntries.some((entry) => entry.premixNo === premixNo)) {
      solidPremixEntries.push({ premixNo });
    }
    const existing = solidPremixValuesByNo[premixNo] ?? createQcInitialValues(schema);
    solidPremixValuesByNo[premixNo] = {
      ...existing,
      ...hydrateQcValuesFromSections(schema, [section]),
    };
  });

  solidPremixEntries.sort((a, b) => a.premixNo - b.premixNo);
  return { solidPremixEntries, solidPremixValuesByNo };
};

const hydratePremixSlotState = (
  state: QualityControlFormState,
  schema: SchemaDocumentV2,
  subType: QcApiSubType,
  slot: QcProcessingSlot,
  entriesKey: "solidPremixEntries" | "liquidPremixEntries",
  valuesKey: "solidPremixValuesByNo" | "liquidPremixValuesByNo",
) => {
  if (subType !== slot) {
    return {
      [entriesKey]: state[entriesKey] ?? [],
      [valuesKey]: state[valuesKey] ?? {},
    };
  }

  if (state.savedSections?.length) {
    const hydrated = hydratePremixStateFromSections(schema, state.savedSections, slot, state.subType);
    return {
      [entriesKey]: hydrated.solidPremixEntries,
      [valuesKey]: hydrated.solidPremixValuesByNo,
    };
  }

  return {
    [entriesKey]: state[entriesKey] ?? [],
    [valuesKey]: state[valuesKey] ?? {},
  };
};

export const hydrateQualityControlFormState = (
  state: QualityControlFormState,
  schema: SchemaDocumentV2,
  division: QcApiDivision,
  subType: QcApiSubType,
): QualityControlFormState => {
  const key = getQcSchemaCacheKey(division, subType);
  const solidPremixState = hydratePremixSlotState(
    state,
    schema,
    subType,
    "SOLID_PROCESSING",
    "solidPremixEntries",
    "solidPremixValuesByNo",
  );
  const liquidPremixState = hydratePremixSlotState(
    state,
    schema,
    subType,
    "LIQUID_PROCESSING",
    "liquidPremixEntries",
    "liquidPremixValuesByNo",
  );

  const isPremixSubType = subType === "SOLID_PROCESSING" || subType === "LIQUID_PROCESSING";

  return {
    ...state,
    division,
    subType,
    qcSchema: schema,
    schemasByKey: {
      ...(state.schemasByKey ?? {}),
      [key]: schema,
    },
    schemaFormValues: isPremixSubType
      ? state.schemaFormValues
      : state.savedSections?.length
        ? hydrateQcValuesFromSections(schema, state.savedSections)
        : Object.keys(state.schemaFormValues ?? {}).length > 0
          ? state.schemaFormValues
          : createQcInitialValues(schema),
    schemaFormLoaded: true,
    ...solidPremixState,
    ...liquidPremixState,
  };
};

export const mapQualityControlDetailsToFormState = (
  details: Partial<QualityControlDetails>,
): QualityControlFormState => {
  const defaults = createDefaultQualityControlFormState();
  const savedSections = Array.isArray(details?.sections) ? details.sections : undefined;
  const division = (details?.division as QcApiDivision | null) ?? null;
  const subType = (details?.subType as QcApiSubType) ?? null;

  return {
    ...defaults,
    division,
    subType,
    schemaFormLoaded: Boolean(savedSections?.length),
    savedSections,
  };
};

const premixValuesHaveUserData = (valuesByNo?: Record<number, SchemaFormValues>) =>
  Object.values(valuesByNo ?? {}).some((values) => schemaValuesHaveUserData(values ?? {}));

export const hasAnyQualityControlValue = (form: QualityControlFormState) => {
  if (premixValuesHaveUserData(form.solidPremixValuesByNo)) return true;
  if (premixValuesHaveUserData(form.liquidPremixValuesByNo)) return true;
  return schemaValuesHaveUserData(form.schemaFormValues ?? {});
};

const buildPremixSections = (
  schema: SchemaDocumentV2,
  entries: QcPremixEntry[],
  valuesByNo: Record<number, SchemaFormValues> | undefined,
  processingSubType: QcProcessingSlot,
) =>
  entries.flatMap((entry) =>
    buildQcSectionPayload(schema, valuesByNo?.[entry.premixNo] ?? {}).map((section) => ({
      ...section,
      premixNo: entry.premixNo,
      subType: processingSubType,
    })),
  );

export const mapQualityControlPayload = (
  form: QualityControlFormState,
): {
  schemaVersion?: string;
  schemaType?: string;
  division?: QcApiDivision | null;
  subType?: QcApiSubType;
  sections: SchemaSectionSubmission[];
} => {
  const solidSchema = getProcessingSchemaFromFormState(form, "SOLID_PROCESSING");
  const liquidSchema = getProcessingSchemaFromFormState(form, "LIQUID_PROCESSING");
  const solidEntries = form.solidPremixEntries ?? [];
  const liquidEntries = form.liquidPremixEntries ?? [];
  const hasSolidPremix = solidEntries.length > 0 && Boolean(solidSchema);
  const hasLiquidPremix = liquidEntries.length > 0 && Boolean(liquidSchema);

  if (hasSolidPremix || hasLiquidPremix) {
    const sections = [
      ...(hasSolidPremix
        ? buildPremixSections(solidSchema!, solidEntries, form.solidPremixValuesByNo, "SOLID_PROCESSING")
        : []),
      ...(hasLiquidPremix
        ? buildPremixSections(liquidSchema!, liquidEntries, form.liquidPremixValuesByNo, "LIQUID_PROCESSING")
        : []),
    ];

    const primarySchema = solidSchema ?? liquidSchema;

    return {
      schemaVersion: primarySchema?.schemaVersion,
      schemaType: primarySchema?.schemaType ?? QC_SCHEMA_TYPE,
      division: form.division ?? "RAW_MATERIAL_PROCESSING",
      subType: hasSolidPremix && hasLiquidPremix ? null : hasSolidPremix ? "SOLID_PROCESSING" : "LIQUID_PROCESSING",
      sections,
    };
  }

  return {
    schemaVersion: form.qcSchema?.schemaVersion,
    schemaType: form.qcSchema?.schemaType ?? QC_SCHEMA_TYPE,
    division: form.division,
    subType: form.subType,
    sections: form.qcSchema ? buildQcSectionPayload(form.qcSchema, form.schemaFormValues) : [],
  };
};
