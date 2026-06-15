import { MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import FormInput from "./FormInput";
import { schemaSelectMenuProps } from "./fieldStyles";
import {
  fetchSchemaDataSourceOptions,
  resolveSchemaOptionKeys,
  staticDataSourceOptions,
  type SchemaApiContext,
} from "../../../schema-engine/rules/apiDependency";
import type { SchemaDataSource } from "../../../schema-engine/types";

type SchemaApiDropdownProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  dataSource?: SchemaDataSource;
  apiContext?: SchemaApiContext;
  disabled?: boolean;
  required?: boolean;
};

const SchemaApiDropdown = ({
  label,
  value,
  onChange,
  dataSource,
  apiContext,
  disabled,
  required,
}: SchemaApiDropdownProps) => {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataSource) {
      setOptions([]);
      return;
    }

    if (dataSource.type === "static") {
      setOptions(staticDataSourceOptions(dataSource));
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchSchemaDataSourceOptions(dataSource, apiContext).then(({ options: rows, error: fetchError }) => {
      if (cancelled) return;
      setLoading(false);
      setError(fetchError);
      const keys = resolveSchemaOptionKeys(dataSource.api.displayKey, dataSource.api.valueKey, rows);
      setOptions(
        rows.map((row) => ({
          label: String(row[keys.displayKey] ?? ""),
          value: String(row[keys.valueKey] ?? ""),
        })),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [dataSource, apiContext]);

  return (
    <FormInput
      select
      label={label}
      value={value}
      onChange={(e) => onChange(String(e.target.value))}
      disabled={disabled || loading}
      required={required}
      helperText={error ?? undefined}
      SelectProps={{ MenuProps: schemaSelectMenuProps }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </FormInput>
  );
};

export default SchemaApiDropdown;
