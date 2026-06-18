import {
  createDefaultNDTFormState,
  normalizeNDTFormState,
  normalizeNDTMotorSession,
  type NDTFileValue,
  type NDTFormState,
  type NDTMotorSession,
} from "./NDTFormModel";

export type NDTSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

const normalizeFilePaths = (files: NDTFileValue[] = []): string[] =>
  files
    .map((file) => (typeof file === "string" ? file : ""))
    .filter((path) => path.trim().length > 0);

const normalizeSingleFilePath = (file: NDTFileValue | null | undefined): string | null => {
  if (!file) return null;
  return typeof file === "string" ? file : null;
};

const mapMotorSessionFromApi = (motor: any): NDTMotorSession =>
  normalizeNDTMotorSession({
    motorId: String(motor?.motorId ?? ""),
    additionalExposureRows: motor?.additionalExposureRows,
    radiographyObservationRows: motor?.radiographyObservationRows,
    visualInspectionRows: motor?.visualInspectionRows,
    visualInspectionMedia: motor?.visualInspectionMediaFilePaths ?? motor?.visualInspectionMedia,
    signedReport: motor?.signedReportFilePath ?? motor?.signedReport,
    additionalRemarks: motor?.additionalRemarks,
  });

const mapMotorSessionToApi = (motor: NDTMotorSession) => ({
  motorId: motor.motorId ?? "",
  additionalExposureRows: (motor.additionalExposureRows ?? []).map((row) => ({
    sectionNumber: row.sectionNumber ?? "",
    orientation: row.orientation ?? "",
    exposureCount: row.exposureCount ?? "",
  })),
  radiographyObservationRows: (motor.radiographyObservationRows ?? []).map((row) => ({
    section: row.section ?? "",
    orientation: row.orientation ?? "",
    observations: row.observations ?? "",
    filePaths: normalizeFilePaths(row.files ?? []),
  })),
  visualInspectionRows: (motor.visualInspectionRows ?? []).map((row) => ({
    observation: row.observation ?? "",
    isPreset: row.isPreset,
    section: row.section ?? "",
    orientation: row.orientation ?? "",
    filePaths: normalizeFilePaths(row.files ?? []),
  })),
  visualInspectionMediaFilePaths: normalizeFilePaths(motor.visualInspectionMedia ?? []),
  signedReportFilePath: normalizeSingleFilePath(motor.signedReport),
  additionalRemarks: motor.additionalRemarks ?? "",
});

const hydrateFormState = (payload: any): NDTFormState => {
  if (Array.isArray(payload?.motors) && payload.motors.length > 0) {
    return normalizeNDTFormState({
      batchId: payload?.batchId ?? "",
      formLoaded: true,
      equipment: payload?.equipment ?? "",
      beamEnergies: Array.isArray(payload?.beamEnergies) ? payload.beamEnergies : [],
      radiographyPlan: payload?.radiographyPlan ?? "",
      radiographyPlanRows: Array.isArray(payload?.radiographyPlanRows) ? payload.radiographyPlanRows : [],
      motors: payload.motors.map(mapMotorSessionFromApi),
      motorId: payload?.motorId ?? payload.motors[0]?.motorId,
    });
  }

  return normalizeNDTFormState({
    batchId: payload?.batchId,
    motorId: payload?.motorId,
    equipment: payload?.equipment,
    beamEnergies: payload?.beamEnergies,
    radiographyPlan: payload?.radiographyPlan,
    radiographyPlanRows: payload?.radiographyPlanRows,
    additionalExposureRows: payload?.additionalExposureRows,
    radiographyObservationRows: payload?.radiographyObservationRows,
    visualInspectionRows: payload?.visualInspectionRows,
    visualInspectionMedia: payload?.visualInspectionMediaFilePaths ?? payload?.visualInspectionMedia,
    signedReport: payload?.signedReportFilePath ?? payload?.signedReport,
    additionalRemarks: payload?.additionalRemarks,
    formLoaded: true,
  });
};

export class NDTSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): NDTSubmitResponseModel {
    return new NDTSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class NDTDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  data: NDTFormState;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.data = hydrateFormState(payload);
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): NDTDetailsModel {
    return new NDTDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: NDTDetailsModel): NDTFormState {
    return model.data;
  }
}

export const mapNDTPayload = (form: NDTFormState) => {
  const normalized = normalizeNDTFormState(form);
  const primaryMotor = normalized.motors[0];

  return {
    batchId: normalized.batchId ?? "",
    motorId: primaryMotor?.motorId ?? normalized.motorId ?? "",
    equipment: normalized.equipment ?? "",
    beamEnergies: normalized.beamEnergies ?? [],
    radiographyPlan: normalized.radiographyPlan ?? "",
    radiographyPlanRows: (normalized.radiographyPlanRows ?? []).map((row) => ({
      srNo: row.srNo,
      sections: row.sections ?? "",
      orientations: row.orientations ?? "",
      sfd: row.sfd ?? "",
      normalExposures: row.normalExposures ?? "",
      tangentialExposures: row.tangentialExposures ?? "",
      detectorType: row.detectorType ?? "",
    })),
    motors: normalized.motors.map(mapMotorSessionToApi),
    additionalExposureRows: (primaryMotor?.additionalExposureRows ?? []).map((row) => ({
      sectionNumber: row.sectionNumber ?? "",
      orientation: row.orientation ?? "",
      exposureCount: row.exposureCount ?? "",
    })),
    radiographyObservationRows: (primaryMotor?.radiographyObservationRows ?? []).map((row) => ({
      section: row.section ?? "",
      orientation: row.orientation ?? "",
      observations: row.observations ?? "",
      filePaths: normalizeFilePaths(row.files ?? []),
    })),
    visualInspectionRows: (primaryMotor?.visualInspectionRows ?? []).map((row) => ({
      observation: row.observation ?? "",
      isPreset: row.isPreset,
      section: row.section ?? "",
      orientation: row.orientation ?? "",
      filePaths: normalizeFilePaths(row.files ?? []),
    })),
    visualInspectionMediaFilePaths: normalizeFilePaths(primaryMotor?.visualInspectionMedia ?? []),
    signedReportFilePath: normalizeSingleFilePath(primaryMotor?.signedReport ?? null),
    additionalRemarks: primaryMotor?.additionalRemarks ?? "",
  };
};

export { createDefaultNDTFormState };
