import { useCallback, useEffect, useState } from "react";
import schemaEngineController, { type SchemaFetchConfig } from "../controller/schemaEngineController";
import type { SchemaDocumentV2 } from "../types";

export const SCHEMA_LOAD_FAILED_MESSAGE = "Schema failed to load. Please try again.";

export const useSchemaFetch = (
  config: SchemaFetchConfig | null,
  requestBody: Record<string, unknown> | null,
  enabled = true,
) => {
  const [schema, setSchema] = useState<SchemaDocumentV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!config?.endpoint || !requestBody) return null;
    setLoading(true);
    setError(null);

    const response = await schemaEngineController.fetchSchema(config, requestBody);
    setLoading(false);

    if (!response.success) {
      setError(response.message ?? SCHEMA_LOAD_FAILED_MESSAGE);
      setSchema(null);
      return null;
    }

    if (!response.data?.data?.sections?.length) {
      setError(
        response.data
          ? "Schema response is missing sections."
          : response.message ?? SCHEMA_LOAD_FAILED_MESSAGE,
      );
      setSchema(null);
      return null;
    }

    setSchema(response.data);
    return response.data;
  }, [config, requestBody]);

  useEffect(() => {
    if (!enabled) return;
    fetchSchema();
  }, [enabled, fetchSchema]);

  return { schema, loading, error, refetch: fetchSchema };
};

export default useSchemaFetch;
