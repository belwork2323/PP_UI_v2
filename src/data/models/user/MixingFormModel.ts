import {
  createProcessParticularRows,
  createQualityCheckRows,
  getMixingCycleByValue,
  isQuadObservedLayout,
  type QualityObservedLayout,
} from "../../../hooks/user/manufacturing/mixingConfig";

export type ProcessParticularRow = {
  id: number;
  operation: string;
  rpm: string;
  time: string;
  temp: string;
  vacuum: string;
};

export type QualityCheckRow = {
  parameter: string;
  specification: string;
  observedLayout: QualityObservedLayout;
  observed1: string;
  observed2: string;
  observed3: string;
  observed4: string;
};

export type PremixEntry = {
  premixNo: string;
  mixerBldgNo: string;
  bowlId: string;
  bowlTrialDate: string;
  bowlTrialObservations: string;
  premixDate: string;
  premixQuantity: string;
  mixingCycle: string;
  processParticulars: ProcessParticularRow[];
  qualityChecks: QualityCheckRow[];
};

export type FinalMixEntry = {
  mixNo: string;
  linkedPremixNo: string;
  mixerBldgNo: string;
  bowlId: string;
  finalMixCycle: string;
  qualityChecks: QualityCheckRow[];
};

export type MixingFormState = {
  premixCards: PremixEntry[];
  finalMixCards: FinalMixEntry[];
};
export type MixingStage = {
  stageType: string;
  premixes: any[];
};
export type MixingDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  mixingDetails?: {
    stages: MixingStage[];
  };
};
const mapApiProcessRows = (
  sections: any[]
): ProcessParticularRow[] => {

  const rows: ProcessParticularRow[] = [];

  sections.forEach(section => {
    const row: ProcessParticularRow = {
      id: rows.length + 1,
      operation: section.sectionName ?? "",
      rpm: "",
      time: "",
      temp: "",
      vacuum: "",
    };

    section.rows?.forEach((field: any) => {
      switch (field.fieldLabel) {
        case "RPM":
          row.rpm = field.value;
          break;

        case "Time":
          row.time = field.value;
          break;

        case "Temperature":
          row.temp = field.value;
          break;

        case "Vacuum Applied":
          row.vacuum = field.value;
          break;
      }
    });

    rows.push(row);
  });

  return rows;
};
const normalizeProcessRow = (row: any, fallbackOperation = "", fallbackId?: number): ProcessParticularRow => ({
  id: Number(row?.id ?? fallbackId ?? 0),
  operation: String(row?.operation ?? row?.operationLabel ?? fallbackOperation),
  rpm: String(row?.rpm ?? ""),
  time: String(row?.time ?? ""),
  temp: String(row?.temp ?? ""),
  vacuum: String(row?.vacuum ?? ""),
});

const normalizeQualityRow = (row: any, fallback: QualityCheckRow): QualityCheckRow => ({
  parameter: String(row?.parameter ?? fallback.parameter),
  specification: String(row?.specification ?? fallback.specification),
  observedLayout: row?.observedLayout ?? fallback.observedLayout,
  observed1: String(row?.observed1 ?? ""),
  observed2: String(row?.observed2 ?? ""),
  observed3: String(row?.observed3 ?? ""),
  observed4: String(row?.observed4 ?? ""),
});

export const createEmptyPremixEntry = (premixNo: number): PremixEntry => ({
  premixNo: String(premixNo),
  mixerBldgNo: "",
  bowlId: "",
  bowlTrialDate: "",
  bowlTrialObservations: "",
  premixDate: "",
  premixQuantity: "",
  mixingCycle: "",
  processParticulars: [],
  qualityChecks: createQualityCheckRows(),
});

export const createEmptyFinalMixEntry = (mixNo: number): FinalMixEntry => ({
  mixNo: String(mixNo),
  linkedPremixNo: "",
  mixerBldgNo: "",
  bowlId: "",
  finalMixCycle: "",
  qualityChecks: createQualityCheckRows(),
});

const normalizeFinalMixEntry = (entry: Partial<FinalMixEntry>, fallbackNo: number): FinalMixEntry => {
  const qualityChecks = mapApiQualityChecksToRows(
  entry.qualityChecks
);
  return {
    mixNo: String(entry.mixNo ?? fallbackNo),
    linkedPremixNo: String(entry.linkedPremixNo ?? ""),
    mixerBldgNo: String(entry.mixerBldgNo ?? ""),
    bowlId: String(entry.bowlId ?? ""),
    finalMixCycle: String(entry.finalMixCycle ?? ""),
    qualityChecks,
  };
};

export const createDefaultMixingFormState = (): MixingFormState => ({
  premixCards: [],
  finalMixCards: [],
});

const resolveProcessParticulars = (premix: Partial<PremixEntry>): ProcessParticularRow[] => {
  if (Array.isArray(premix.processParticulars) && premix.processParticulars.length > 0) {
    return premix.processParticulars.map((row, index) =>
      normalizeProcessRow(row, row.operation, index + 1),
    );
  }

  const cycle = getMixingCycleByValue(String(premix.mixingCycle ?? ""));
  if (cycle) {
    return createProcessParticularRows(cycle.operations);
  }

  return [];
};const mapApiQualityChecksToRows = (qualityChecks: any): QualityCheckRow[] => {
  const defaults = createQualityCheckRows();

  return defaults.map((row) => {
    switch (row.parameter) {
      case "Homogeneity": {
        const h = qualityChecks?.homogeneity ?? [];

        return {
          ...row,
          observed1: String(h?.[0]?.observedValue ?? ""),
          observed2: String(h?.[1]?.observedValue ?? ""),
          observed3: String(h?.[2]?.observedValue ?? ""),
          observed4: String(h?.[3]?.observedValue ?? ""),
        };
      }

      case "Moisture %": {
        const m = qualityChecks?.moisturePercentage;

        return {
          ...row,
          specification: String(m?.specification ?? row.specification),
          observed1: String(m?.observedValues?.[0] ?? ""),
          observed2: String(m?.observedValues?.[1] ?? ""),
          observed3: String(m?.observedValues?.[2] ?? ""),
          observed4: String(m?.observedValues?.[3] ?? ""),
        };
      }

      case "EOM Viscosity": {
        const v = qualityChecks?.eomViscosity;

        return {
          ...row,
          specification: String(v?.specification ?? row.specification),
          observed1: String(v?.observedValues?.[0] ?? ""),
          observed2: String(v?.observedValues?.[1] ?? ""),
          observed3: String(v?.observedValues?.[2] ?? ""),
          observed4: String(v?.observedValues?.[3] ?? ""),
        };
      }

      case "EOM Temperature": {
        const t = qualityChecks?.eomTemperature;

        return {
          ...row,
          specification: String(t?.specification ?? row.specification),
          observed1: String(t?.observedValues?.[0] ?? ""),
          observed2: String(t?.observedValues?.[1] ?? ""),
          observed3: String(t?.observedValues?.[2] ?? ""),
          observed4: String(t?.observedValues?.[3] ?? ""),
        };
      }

      default:
        return row;
    }
  });
};
const normalizePremixEntry = (premix: Partial<PremixEntry>, fallbackNo: number): PremixEntry => {
  const qualityChecks = mapApiQualityChecksToRows(
    premix.qualityChecks
);

  return {
    premixNo: String(premix.premixNo ?? fallbackNo),
    mixerBldgNo: String(premix.mixerBldgNo ?? ""),
    bowlId: String(premix.bowlId ?? ""),
    bowlTrialDate: String(premix.bowlTrialDate ?? ""),
    bowlTrialObservations: String(premix.bowlTrialObservations ?? ""),
    premixDate: String(premix.premixDate ?? ""),
    premixQuantity: String(premix.premixQuantity ?? ""),
    mixingCycle: String(premix.mixingCycle ?? ""),
    processParticulars: resolveProcessParticulars(premix),
    qualityChecks,
  };
};

export const mapMixingDetailsToFormState = (
  details: Partial<MixingDetails>,
): MixingFormState => {

  const stages = details?.mixingDetails?.stages ?? [];

  const premixStage = stages.find(
    (stage) => stage.stageType === "PREMIX",
  );

  const finalMixStage = stages.find(
    (stage) => stage.stageType === "FINAL_MIX",
  );

  const apiPremixes = premixStage?.premixes ?? [];
  const apiFinalMixes = finalMixStage?.premixes ?? [];

  return {
    premixCards: apiPremixes.map((premix: any, index: number) =>
      normalizePremixEntry(
        {
          premixNo: premix.premixNo,

          mixerBldgNo:
            premix?.mixerConfiguration?.mixerId ?? "",

          bowlId:
            premix?.mixerConfiguration?.bowlId ?? "",

          bowlTrialDate:
            premix?.trialDetails?.trialDate ?? "",

          bowlTrialObservations:
            premix?.trialDetails?.observations ?? "",

          premixDate:
            premix?.mixDetails?.mixDate ?? "",

          premixQuantity:
            premix?.mixDetails?.mixQuantity ?? "",

          mixingCycle:
            premix?.mixingCycle?.cycleId ?? "",

          processParticulars:
            mapApiProcessRows(
              premix?.processParticulars ?? []
            ),

          qualityChecks:
            premix?.qualityChecks ?? {},
        },
        Number(premix?.premixNo) || index + 1,
      ),
    ),

    finalMixCards: apiFinalMixes.map((entry: any, index: number) =>
      normalizeFinalMixEntry(
        {
          mixNo: entry?.premixNo,

          mixerBldgNo:
            entry?.mixerConfiguration?.mixerId ?? "",

          bowlId:
            entry?.mixerConfiguration?.bowlId ?? "",

          finalMixCycle:
            entry?.mixingCycle?.cycleId ?? "",

          qualityChecks:
            entry?.qualityChecks ?? {},
        },
        Number(entry?.premixNo) || index + 1,
      ),
    ),
  };
};
const mapProcessRowsToApi = (
  rows: ProcessParticularRow[]
) => {
  return rows.map((row, index) => ({
    sectionId: `SEC-${index + 1}`,
    sectionName: row.operation,

    rows: [
      {
        fieldId: `RPM-${index + 1}`,
        fieldLabel: "RPM",
        value: row.rpm ?? "",
      },
      {
        fieldId: `TIME-${index + 1}`,
        fieldLabel: "Time",
        value: row.time ?? "",
      },
      {
        fieldId: `TEMP-${index + 1}`,
        fieldLabel: "Temperature",
        value: row.temp ?? "",
      },
      {
        fieldId: `VAC-${index + 1}`,
        fieldLabel: "Vacuum Applied",
        value: row.vacuum ?? "",
      },
    ],
  }));
};
const mapQualityChecksToApi = (rows: QualityCheckRow[]) => {
  const findRow = (name: string) =>
    rows.find(
      (r) =>
        r.parameter.toLowerCase().trim() ===
        name.toLowerCase().trim()
    );

  const homogeneity = findRow("Homogeneity");
  const moisture = findRow("Moisture %");
  const viscosity = findRow("EOM Viscosity");
  const temperature = findRow("EOM Temperature");

  return {
    homogeneity: homogeneity
    ? [
        homogeneity.observed1 && {
          sampleNo: 1,
          observedValue: homogeneity.observed1,
        },
        homogeneity.observed2 && {
          sampleNo: 2,
          observedValue: homogeneity.observed2,
        },
        homogeneity.observed3 && {
          sampleNo: 3,
          observedValue: homogeneity.observed3,
        },
        homogeneity.observed4 && {
          sampleNo: 4,
          observedValue: homogeneity.observed4,
        },
      ].filter(Boolean)
    : [],

      moisturePercentage: moisture
        ? {
            specification: moisture.specification,
            observedValues: [
              moisture.observed1,
              moisture.observed2,
              moisture.observed3,
              moisture.observed4,
            ].filter(v => String(v).trim() !== ""),
          }
        : null,

    eomViscosity: viscosity
      ? {
          specification: viscosity.specification,
          observedValues: [
              viscosity.observed1,
              viscosity.observed2,
              viscosity.observed3,
              viscosity.observed4,
            ].filter(v => String(v).trim() !== ""),
          }
      : null,

    eomTemperature: temperature
      ? {
          specification: temperature.specification,
          observedValues: [
              temperature.observed1,
              temperature.observed2,
              temperature.observed3,
              temperature.observed4,
            ].filter(v => String(v).trim() !== ""),
          }
      : null,
  };
};
export const mapMixingFormStateToPayload = (
  form: MixingFormState,
) => ({
  mixingDetails: {
    stages: [
      {
        stageType: "PREMIX",

        premixes: (form.premixCards ?? []).map(
          (premix) => ({
            premixNo:
              Number(premix.premixNo) || 0,

            mixerConfiguration: {
              mixerId:
                premix.mixerBldgNo,

              bowlId:
                premix.bowlId,
            },

            trialDetails: {
              trialDate:
                premix.bowlTrialDate || null,

              observations:
                premix.bowlTrialObservations,
            },

            mixDetails: {
              mixDate:
                premix.premixDate || null,

              mixQuantity:
                premix.premixQuantity || null,
            },

            mixingCycle: {
              cycleId:
                premix.mixingCycle,

              cycleName:
                premix.mixingCycle,
            },

            processParticulars:
              mapProcessRowsToApi(
                premix.processParticulars ?? []
              ),
            qualityChecks:
              mapQualityChecksToApi(premix.qualityChecks),
          }),
        ),
      },

      {
        stageType: "FINAL_MIX",

        premixes: (form.finalMixCards ?? []).map(
          (entry) => ({
            premixNo:
              Number(entry.mixNo) || 0,

            mixerConfiguration: {
              mixerId:
                entry.mixerBldgNo,

              bowlId:
                entry.bowlId,
            },

            mixingCycle: {
              cycleId:
                entry.finalMixCycle,

              cycleName:
                entry.finalMixCycle,
            },

            qualityChecks:
              mapQualityChecksToApi(entry.qualityChecks),
          }),
        ),
      },
    ],
  },
});

const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;

const premixHasValue = (premix: PremixEntry) => {
  const headerFilled =
    hasValue(premix.mixerBldgNo) ||
    hasValue(premix.bowlId) ||
    hasValue(premix.bowlTrialDate) ||
    hasValue(premix.bowlTrialObservations) ||
    hasValue(premix.premixDate) ||
    hasValue(premix.premixQuantity) ||
    hasValue(premix.mixingCycle);

  const processFilled = (premix.processParticulars ?? []).some((row) =>
    [row.rpm, row.time, row.temp, row.vacuum].some(hasValue),
  );

  const qualityFilled = (premix.qualityChecks ?? []).some((row) => {
    if (isQuadObservedLayout(row.observedLayout)) {
      return [row.observed1, row.observed2, row.observed3, row.observed4].some(hasValue);
    }
    return hasValue(row.observed1);
  });

  return headerFilled || processFilled || qualityFilled;
};

const finalMixHasValue = (entry: FinalMixEntry) => {
  const headerFilled =
    hasValue(entry.linkedPremixNo) ||
    hasValue(entry.mixerBldgNo) ||
    hasValue(entry.bowlId) ||
    hasValue(entry.finalMixCycle);

  const qualityFilled = (entry.qualityChecks ?? []).some((row) => {
    if (isQuadObservedLayout(row.observedLayout)) {
      return [row.observed1, row.observed2, row.observed3, row.observed4].some(hasValue);
    }
    return hasValue(row.observed1);
  });

  return headerFilled || qualityFilled;
};

export const hasAnyMixingValue = (form: MixingFormState) =>
  (form.premixCards ?? []).some(premixHasValue) ||
  (form.finalMixCards ?? []).some(finalMixHasValue);

export class MixingSubmitResponseModel {
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
    return new MixingSubmitResponseModel(data);
  }
}

export class MixingDetailsModel {
  static fromApi(data: any): MixingDetails {
    const payload = data?.data ?? data ?? {};

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(
        payload?.subDepartmentId ?? 0,
      ),
      formSubmissionType: String(
        payload?.formSubmissionType ?? "",
      ),
      mixingDetails:
        payload?.mixingDetails ?? {
          stages: [],
        },
    };
  }
}
