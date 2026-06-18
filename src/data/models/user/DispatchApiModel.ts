import {
  mapDispatchDetailsToFormState,
  mapDispatchFormStateToPayload,
  type DispatchFormState,
} from "./DispatchFormModel";
import type { SchemaSectionSubmission } from "../../../schema-engine";

export type DispatchSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export class DispatchSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): DispatchSubmitResponseModel {
    return new DispatchSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class DispatchDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorStage: string;
  motorId: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
  sections: SchemaSectionSubmission[];
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.motorStage = payload?.motorStage ?? "";
    this.motorId = payload?.motorId ?? "";
    this.castingDate = payload?.castingDate ?? "";
    this.dispatchDate = payload?.dispatchDate ?? "";
    this.dispatchLocation = payload?.dispatchLocation ?? "";
    this.ndtClearance = payload?.ndtClearance ?? "";
    this.ndtMomNo = payload?.ndtMomNo ?? "";
    this.finalAcceptanceClearance = payload?.finalAcceptanceClearance ?? "";
    this.finalAcceptanceMomNo = payload?.finalAcceptanceMomNo ?? "";
    this.sections = Array.isArray(payload?.sections) ? payload.sections : [];
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): DispatchDetailsModel {
    return new DispatchDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: DispatchDetailsModel) {
    return mapDispatchDetailsToFormState({
      formId: model.formId,
      batchId: model.batchId,
      subDepartmentId: model.subDepartmentId,
      formSubmissionType: model.formSubmissionType,
      motorStage: model.motorStage,
      motorId: model.motorId,
      castingDate: model.castingDate,
      dispatchDate: model.dispatchDate,
      dispatchLocation: model.dispatchLocation,
      ndtClearance: model.ndtClearance,
      ndtMomNo: model.ndtMomNo,
      finalAcceptanceClearance: model.finalAcceptanceClearance,
      finalAcceptanceMomNo: model.finalAcceptanceMomNo,
      sections: model.sections,
    });
  }
}

export const mapDispatchPayload = (form: DispatchFormState) =>
  mapDispatchFormStateToPayload(form);
