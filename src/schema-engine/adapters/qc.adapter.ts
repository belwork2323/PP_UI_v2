import { USER_QC_DIVISION_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const QC_SCHEMA_FUNCTIONALITY = "CREATE_QC_FORM";
export const QC_SCHEMA_TYPE = "QC";
export const QC_SCHEMA_VERSION = "1.0";

export type QcApiDivision =
  | "RAW_MATERIAL_REVALIDATION"
  | "RAW_MATERIAL_PROCESSING";

export type QcApiSubType = "SOLID_PROCESSING" | "LIQUID_PROCESSING" | null;

export const qcSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_QC_DIVISION_ENDPOINTS.SCHEMA,
};

export const buildQcSchemaRequest = (params: {
  subDepartmentId: number;
  division: QcApiDivision;
  subType?: QcApiSubType;
}) => ({
  schemaVersion: QC_SCHEMA_VERSION,
  schemaType: QC_SCHEMA_TYPE,
  layout: { type: "flat" },
  division: params.division,
  subType: params.subType ?? null,
  subDepartmentId: params.subDepartmentId,
  functionality: QC_SCHEMA_FUNCTIONALITY,
});

export const createQcInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydrateQcValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildQcSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

export const fetchQcSchema = async (params: {
  subDepartmentId: number;
  division: QcApiDivision;
  subType?: QcApiSubType;
}) => {
  const request = buildQcSchemaRequest(params);
  return schemaEngineController.fetchSchema(qcSchemaFetchConfig, request);
};
