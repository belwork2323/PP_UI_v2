import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  DispatchDetailsModel,
  DispatchSubmitResponseModel,
} from "../../../data/models/user/DispatchApiModel";
import {
  createDispatchFormApi,
  fetchDispatchFormDetailsApi,
  updateDispatchFormApi,
} from "../../../data/api/users/dispatch/dispatchAPI";

export type DispatchCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
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
  sections: unknown[];
};

export type DispatchUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
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
  sections: unknown[];
};

export type DispatchDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const dispatchController = {
  createForm: async (payload: DispatchCreatePayload) => {
    try {
      const response = await createDispatchFormApi(payload);
      return new ApiResponseModel<DispatchSubmitResponseModel>(response, (res) =>
        DispatchSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create Dispatch form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: DispatchDetailsPayload) => {
    try {
      const response = await fetchDispatchFormDetailsApi(payload);
      return new ApiResponseModel<DispatchDetailsModel>(response, (res) =>
        DispatchDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch Dispatch form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: DispatchUpdatePayload) => {
    try {
      const response = await updateDispatchFormApi(payload);
      return new ApiResponseModel<DispatchSubmitResponseModel>(response, (res) =>
        DispatchSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update Dispatch form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default dispatchController;
