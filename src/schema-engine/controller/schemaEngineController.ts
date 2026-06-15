import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";
import { fetchSchemaApi } from "../api/schemaApi";
import { parseSchemaDocument } from "../utils/schemaUtils";
import type { SchemaDocumentV2 } from "../types";

export type SchemaFetchConfig = {
  endpoint: string;
};

export const schemaEngineController = {
  fetchSchema: async (config: SchemaFetchConfig, body: Record<string, unknown>) => {
    try {
      const response = await fetchSchemaApi(config.endpoint, body);
      return new ApiResponseModel<SchemaDocumentV2 | null>(response, (res) => parseSchemaDocument(res));
    } catch (error) {
      console.error("Failed to fetch schema:", error);
      return new ApiResponseModel<SchemaDocumentV2 | null>(error);
    }
  },
};

export default schemaEngineController;
