import type { QualityControlFormState } from "./QualityControlFormModel";
import { mapQualityControlDetailsToFormState } from "./QualityControlFormModel";
import type { SchemaSectionSubmission } from "../../schema-engine";

export type QCDivisionSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export class QCDivisionSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): QCDivisionSubmitResponseModel {
    return new QCDivisionSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class QCDivisionDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  division?: string | null;
  subType?: string | null;
  sections?: SchemaSectionSubmission[];
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.division = payload?.division ?? null;
    this.subType = payload?.subType ?? null;
    this.sections = Array.isArray(payload?.sections) ? payload.sections : undefined;
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): QCDivisionDetailsModel {
    return new QCDivisionDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: QCDivisionDetailsModel): QualityControlFormState {
    return mapQualityControlDetailsToFormState({
      formId: model.formId,
      batchId: model.batchId,
      subDepartmentId: model.subDepartmentId,
      formSubmissionType: model.formSubmissionType,
      division: model.division,
      subType: model.subType,
      sections: model.sections,
    });
  }
}
