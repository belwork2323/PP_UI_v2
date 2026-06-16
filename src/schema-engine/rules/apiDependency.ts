import { get, post } from "../../data/api/httpClient";
import { USER_OPERATIONS_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaApiDataSource, SchemaDataSource } from "../types";

export type SchemaApiContext = {
  subDepartmentId?: number;
  batchId?: string;
  projectId?: string;
  motorId?: string;
  [key: string]: unknown;
};

const ENDPOINT_ALIASES: Record<string, string> = {
  "casting-station": USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST,
  "motors-stage-list": USER_OPERATIONS_ENDPOINTS.MOTORS_STAGE_LIST,
  MOTORS_STAGE_LIST: USER_OPERATIONS_ENDPOINTS.MOTORS_STAGE_LIST,
  "approved-motors-list": USER_OPERATIONS_ENDPOINTS.APPROVED_MOTORS_LIST,
  APPROVED_MOTORS_LIST: USER_OPERATIONS_ENDPOINTS.APPROVED_MOTORS_LIST,
  "material-lots": USER_OPERATIONS_ENDPOINTS.MATERIAL_LOTS,
};

export const resolveSchemaApiEndpoint = (endpoint: string): string => {
  const raw = String(endpoint ?? "").trim();
  if (!raw) return "";

  const alias = ENDPOINT_ALIASES[raw];
  if (alias) return alias;

  if (raw.includes("casting-station")) return USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST;
  if (raw.includes("motors-stage-list")) return USER_OPERATIONS_ENDPOINTS.MOTORS_STAGE_LIST;
  if (raw.includes("approved-motors-list")) return USER_OPERATIONS_ENDPOINTS.APPROVED_MOTORS_LIST;
  if (raw.includes("material-lots")) return USER_OPERATIONS_ENDPOINTS.MATERIAL_LOTS;

  if (raw.startsWith("/api/v1")) return raw;
  if (raw.startsWith("api/v1")) return `/${raw}`;
  if (raw.startsWith("/user/")) return `/api/v1${raw}`;
  if (raw.startsWith("user/")) return `/api/v1/${raw}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const TEMPLATE_PATTERN = /\{\{(\w+)\}\}/g;

const resolveTemplateValue = (value: unknown, apiContext?: SchemaApiContext): unknown => {
  if (typeof value !== "string" || !value.includes("{{")) return value;
  return value.replace(TEMPLATE_PATTERN, (match, token: string) => {
    const ctx = apiContext?.[token];
    return ctx != null && ctx !== "" ? String(ctx) : match;
  });
};

const mergeApiContext = (
  requestBody: Record<string, unknown>,
  apiContext?: SchemaApiContext,
): Record<string, unknown> => {
  const params = Object.fromEntries(
    Object.entries(requestBody).map(([key, value]) => [key, resolveTemplateValue(value, apiContext)]),
  );

  const subDeptId = apiContext?.subDepartmentId;
  if (subDeptId) {
    if ("subdepartmentId" in requestBody) params.subdepartmentId = subDeptId;
    if ("subDepartmentId" in requestBody) params.subDepartmentId = subDeptId;
  }

  const batchId = apiContext?.batchId?.trim();
  if (batchId && "batchId" in requestBody) params.batchId = batchId;

  const projectId = apiContext?.projectId?.trim();
  if (projectId && "projectId" in requestBody) params.projectId = projectId;

  return params;
};

/** Normalize flat or string `dataSource.api` shapes from backend schemas. */
export const resolveDataSourceApi = (
  dataSource: SchemaDataSource & Record<string, unknown>,
): SchemaApiDataSource | null => {
  if (dataSource.type !== "api") return null;

  const flatMethod = dataSource.method as SchemaApiDataSource["method"] | undefined;
  const flatRequestField =
    typeof dataSource.requestField === "string" ? dataSource.requestField.trim() : undefined;
  const flatRequestBody = dataSource.requestBody as Record<string, unknown> | undefined;
  const flatResponsePath = typeof dataSource.responsePath === "string" ? dataSource.responsePath : undefined;
  const flatDisplayKey = typeof dataSource.displayKey === "string" ? dataSource.displayKey : undefined;
  const flatValueKey = typeof dataSource.valueKey === "string" ? dataSource.valueKey : undefined;

  const raw = dataSource.api;
  if (typeof raw === "string") {
    return {
      endpoint: raw,
      method: flatMethod,
      requestField: flatRequestField,
      requestBody: flatRequestBody,
      responsePath: flatResponsePath,
      displayKey: flatDisplayKey,
      valueKey: flatValueKey,
    };
  }

  if (!raw || typeof raw !== "object") return null;

  const api = raw as SchemaApiDataSource & Record<string, unknown>;
  return {
    endpoint: String(api.endpoint ?? api.url ?? ""),
    method: (api.method as SchemaApiDataSource["method"] | undefined) ?? flatMethod,
    requestField:
      typeof api.requestField === "string"
        ? api.requestField.trim()
        : flatRequestField,
    requestBody: (api.requestBody as Record<string, unknown> | undefined) ?? flatRequestBody,
    responsePath: typeof api.responsePath === "string" ? api.responsePath : flatResponsePath,
    displayKey: typeof api.displayKey === "string" ? api.displayKey : flatDisplayKey,
    valueKey: typeof api.valueKey === "string" ? api.valueKey : flatValueKey,
  };
};

const buildSchemaApiPayload = (
  api: SchemaApiDataSource,
  apiContext?: SchemaApiContext,
): Record<string, unknown> => {
  const payload = mergeApiContext({ ...(api.requestBody ?? {}) }, apiContext);

  const requestField = String(api.requestField ?? "").trim();
  if (requestField && apiContext) {
    const value = apiContext[requestField];
    if (value != null && String(value).trim() !== "") {
      payload[requestField] = value;
    }
  }

  return payload;
};

const NESTED_LIST_KEYS = ["materials", "items", "list", "records", "lots", "options", "results", "data"] as const;

const resolveResponsePath = (root: Record<string, unknown>, path: string): unknown =>
  path
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
      return (current as Record<string, unknown>)[segment];
    }, root);

export const extractSchemaApiOptionsList = (
  response: unknown,
  responsePath?: string,
): Record<string, unknown>[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response as Record<string, unknown>[];
  if (typeof response !== "object") return [];

  const root = response as Record<string, unknown>;
  if (responsePath?.trim()) {
    const resolved = resolveResponsePath(root, responsePath.trim());
    return Array.isArray(resolved) ? (resolved as Record<string, unknown>[]) : [];
  }

  const payload = root.data ?? root;
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];

  if (payload && typeof payload === "object") {
    for (const key of NESTED_LIST_KEYS) {
      const candidate = (payload as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
    }
  }

  for (const key of NESTED_LIST_KEYS) {
    const candidate = root[key];
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
  }

  return [];
};

export const fetchSchemaApiOptions = async (
  api: SchemaApiDataSource,
  apiContext?: SchemaApiContext,
): Promise<{ options: Record<string, unknown>[]; error: string | null }> => {
  const endpoint = resolveSchemaApiEndpoint(api.endpoint ?? "");
  if (!endpoint) return { options: [], error: "API endpoint is not configured." };

  const isCastingStation = endpoint.includes("casting-station");
  const payload = isCastingStation ? {} : buildSchemaApiPayload(api, apiContext);
  const method = String(api.method ?? "POST").trim().toUpperCase() === "GET" ? "GET" : "POST";

  try {
    const response =
      method === "GET" ? await get(endpoint, isCastingStation ? undefined : payload) : await post(endpoint, payload);

    const root = response as Record<string, unknown>;
    if (root?.success === false) {
      return { options: [], error: String(root.message ?? "Unable to load options.") };
    }

    return { options: extractSchemaApiOptionsList(response, api.responsePath), error: null };
  } catch {
    return { options: [], error: "Unable to load options." };
  }
};

export const fetchSchemaDataSourceOptions = async (
  dataSource: SchemaDataSource,
  apiContext?: SchemaApiContext,
) => {
  if (dataSource.type !== "api") return { options: [], error: null };
  const api = resolveDataSourceApi(dataSource as SchemaDataSource & Record<string, unknown>);
  if (!api?.endpoint) return { options: [], error: "API endpoint is not configured." };
  return fetchSchemaApiOptions(api, apiContext);
};

export const resolveSchemaOptionKeys = (
  displayKey: string | undefined,
  valueKey: string | undefined,
  options: Record<string, unknown>[],
): { displayKey: string; valueKey: string } => {
  if (displayKey && valueKey) return { displayKey, valueKey };

  const sample = options[0];
  if (sample && "stationName" in sample) {
    return { displayKey: displayKey ?? "stationName", valueKey: valueKey ?? "stationCode" in sample ? "stationCode" : "stationId" };
  }
  if (sample && "lotId" in sample) return { displayKey: displayKey ?? "lotId", valueKey: valueKey ?? "lotId" };
  if (sample && "motorStage" in sample) return { displayKey: displayKey ?? "motorStage", valueKey: valueKey ?? "motorStage" };
  if (sample && "motorId" in sample) return { displayKey: displayKey ?? "motorId", valueKey: valueKey ?? "motorId" };
  if (sample && "buildingName" in sample) return { displayKey: displayKey ?? "buildingName", valueKey: valueKey ?? "buildingId" };

  return { displayKey: displayKey ?? "label", valueKey: valueKey ?? "value" };
};

export const staticDataSourceOptions = (dataSource: SchemaDataSource) => {
  if (dataSource.type !== "static") return [];
  return dataSource.options.map((opt) => {
    if (typeof opt === "string") return { label: opt, value: opt };
    return opt;
  });
};
