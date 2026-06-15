export { default as SchemaUI } from "./SchemaUI";
export type { SchemaUIProps } from "./SchemaUI";

export { default as SchemaRenderer } from "./SchemaRenderer";
export { default as schemaEngineController } from "./controller/schemaEngineController";
export { default } from "./controller/schemaEngineController";
export type { SchemaFetchConfig } from "./controller/schemaEngineController";

export { useSchemaFetch } from "./hooks/useSchemaFetch";
export { useSchemaForm } from "./hooks/useSchemaForm";

export * from "./types";
export type { SchemaFormValues, SchemaSectionSubmission } from "./state/formState";
export {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
  schemaValuesHaveUserData,
  getBlockValue,
  setBlockValue,
} from "./state/formState";

export { parseSchemaDocument } from "./utils/schemaUtils";
export type { SchemaThemeTokens } from "./utils/schemaUtils";
export { defaultThemeTokens, mergeThemeFromDesignSystem } from "./utils/schemaUtils";

export {
  buildFlatVisibilityContext,
  isSchemaVisible,
  isSectionVisible,
  isBlockVisible,
  pruneHiddenFormValues,
} from "./rules/visibility";

export {
  buildCastingSetupContext,
  resolveSchemaCountToken,
  type SchemaSetupContext,
} from "./utils/setupContext";

export type { SchemaApiContext } from "./rules/apiDependency";
export {
  fetchSchemaApiOptions,
  fetchSchemaDataSourceOptions,
  resolveSchemaApiEndpoint,
  staticDataSourceOptions,
} from "./rules/apiDependency";

export { evaluateRowFormula, applyFormulaColumns } from "./rules/formulaEval";
export { validateFieldValue } from "./validation/validateField";

export { registerBlockType, getBlockComponent } from "./registry/componentRegistry";

/** @deprecated Use SchemaDocumentV2 */
export type SchemaDocument = import("./types").SchemaDocumentV2;

export {
  RMP_SCHEMA_FUNCTIONALITY,
  RMP_SCHEMA_TYPE,
  RMP_SCHEMA_VERSION,
  rawMaterialPrepSchemaFetchConfig,
  buildRawMaterialSchemaRequest,
  buildRawMaterialSchemaRequestFromCodes,
  buildProcessSubmission,
  hydrateValuesFromProcess,
  createInitialValues,
  findMaterialInList,
  findGradeInMaterial,
  derivePremixMaterialType,
} from "./adapters/rawMaterialPreparation.adapter";

export type {
  RawMaterialSchemaRequestParams,
  PreparationPremixEntry,
  PreparationProcessEntry,
  SchemaProcessSubmission,
} from "./adapters/rawMaterialPreparation.adapter";

export {
  CP_SCHEMA_FUNCTIONALITY,
  CP_SCHEMA_TYPE,
  CP_SCHEMA_VERSION,
  casePreparationSchemaFetchConfig,
  buildCasePreparationSchemaRequest,
  mapCasePrepBatchTypeToSchema,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  buildCasePrepSectionPayload,
  buildCasePrepMotorSubmission,
  isCasePrepSchemaDocument,
} from "./adapters/casePreparation.adapter";

export type { CasePrepMotorSubmission } from "./adapters/casePreparation.adapter";

export {
  CC_CASTING_SCHEMA_FUNCTIONALITY,
  CC_CURING_SCHEMA_FUNCTIONALITY,
  CC_SCHEMA_VERSION,
  castingCuringCastingSchemaFetchConfig,
  castingCuringCuringSchemaFetchConfig,
  buildCastingCuringSchemaRequest,
  createCastingCuringInitialValues,
  hydrateCastingCuringValuesFromSections,
  buildCastingCuringSectionPayload,
} from "./adapters/castingCuring.adapter";

export {
  MOCK_TRIAL_SCHEMA_FUNCTIONALITY,
  MOCK_TRIAL_SCHEMA_TYPE,
  MOCK_TRIAL_SCHEMA_VERSION,
  rocketMotorCasingMockTrialSchemaFetchConfig,
  buildMockTrialSchemaRequest,
  buildMockTrialSectionPayload,
  hydrateMockTrialValuesFromSections,
  createMockTrialInitialValues,
  parseMockTrialSavedSections,
} from "./adapters/rocketMotorCasingMockTrial.adapter";

/** Back-compat alias */
export { default as schemaManagementController } from "./controller/schemaEngineController";
