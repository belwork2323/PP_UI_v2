import { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { Typography } from "@mui/material";
import { fetchCastingStationsApi } from "../../../../../data/api/users/operationsApi";
import {
  CASTING_CURING_FLOW_LABELS,
  CASTING_TYPE_OPTIONS,
  canStartCastingCuringForm,
  getCastingMotorCountOptions,
  resolveCastingMotorCount,
  type CastingCuringMotorOption,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";

type CastingCuringFlowBarProps = {
  castingType: string;
  castingStation: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  availableMotorOptions: CastingCuringMotorOption[];
  usedMotorIds: string[];
  schemasReady: boolean;
  onCastingTypeChange: (value: string) => void;
  onCastingStationChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onMotorReceivedAtChange: (value: string) => void;
  onStartForm: () => void;
  schemaLoading?: boolean;
  theme: any;
};

const CastingCuringFlowBar = ({
  castingType,
  castingStation,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  availableMotorOptions,
  usedMotorIds,
  schemasReady,
  onCastingTypeChange,
  onCastingStationChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onMotorReceivedAtChange,
  onStartForm,
  schemaLoading = false,
  theme,
}: CastingCuringFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let active = true;
    void fetchCastingStationsApi().then((response: any) => {
      if (!active) return;
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setStationOptions(
        list.map((item: Record<string, unknown>) => {
          const value = String(item.stationCode ?? item.stationId ?? item.stationName ?? item.code ?? "");
          const label = String(item.stationName ?? item.stationCode ?? value);
          return { value, label };
        }).filter((item) => item.value),
      );
    });
    return () => {
      active = false;
    };
  }, []);

  const resolvedMotorCount = resolveCastingMotorCount(castingType, motorCount);
  const showCustomMotorCount = String(castingType).toLowerCase() === "others";
  const showMotorFields = resolvedMotorCount > 0 && availableMotorOptions.length > 0;
  const motorCountOptions = getCastingMotorCountOptions(availableMotorOptions);

  const canStart = useMemo(
    () =>
      canStartCastingCuringForm({
        castingType,
        castingStation,
        motorCount,
        draftMotorIds,
        motorReceivedAt,
        usedMotorIds,
        schemasReady,
        availableMotorOptions,
      }),
    [
      availableMotorOptions,
      castingStation,
      castingType,
      draftMotorIds,
      motorCount,
      motorReceivedAt,
      schemasReady,
      usedMotorIds,
    ],
  );

  const getMotorOptionsForSlot = (slotIndex: number) => {
    const currentValue = draftMotorIds[slotIndex] ?? "";
    return availableMotorOptions.map((option) => ({
      ...option,
      disabled: option.value !== currentValue && usedMotorIds.includes(option.value),
    }));
  };

  return (
    <Box sx={flowBar.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={CASTING_CURING_FLOW_LABELS.castingType}
            value={castingType}
            placeholder={CASTING_CURING_FLOW_LABELS.castingTypePlaceholder}
            options={CASTING_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            width={200}
            theme={theme}
            onChange={onCastingTypeChange}
          />

          <CasePrepSelect
            label={CASTING_CURING_FLOW_LABELS.castingStation}
            value={castingStation}
            placeholder={CASTING_CURING_FLOW_LABELS.castingStationPlaceholder}
            options={stationOptions}
            width={200}
            theme={theme}
            onChange={onCastingStationChange}
          />

          {showCustomMotorCount ? (
            <CasePrepSelect
              label={CASTING_CURING_FLOW_LABELS.motorCount}
              value={motorCount === "" ? "" : String(motorCount)}
              placeholder={CASTING_CURING_FLOW_LABELS.motorCountPlaceholder}
              options={motorCountOptions}
              width={200}
              theme={theme}
              onChange={(value) => onMotorCountChange(value === "" ? "" : Number(value))}
            />
          ) : null}

          <Box sx={flowBar.selectField?.(260)}>
            <Typography component="label" sx={flowBar.selectLabel}>
              {CASTING_CURING_FLOW_LABELS.motorReceivedAt}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
              <DateTimePicker
                enableAccessibleFieldDOMStructure={false}
                format="DD-MM-YYYY HH:mm"
                disabled={!castingType || !castingStation}
                value={motorReceivedAt ? dayjs(motorReceivedAt, "DD-MM-YYYY HH:mm") : null}
                onChange={(picked) => onMotorReceivedAtChange(picked?.format("DD-MM-YYYY HH:mm") || "")}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    placeholder: CASTING_CURING_FLOW_LABELS.motorReceivedAtPlaceholder,
                    sx: flowBar.selectInput?.(Boolean(motorReceivedAt)),
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        </Box>

        {showMotorFields ? (
          <Box sx={flowBar.motorSelectorBox}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                flexWrap: "wrap",
                gap: 2,
                alignItems: { sm: "flex-end" },
                mb: 1.25,
              }}
            >
              {Array.from({ length: resolvedMotorCount }, (_, idx) => (
                <CasePrepSelect
                  key={`cc-motor-slot-${idx}`}
                  label={`${CASTING_CURING_FLOW_LABELS.motorId} ${resolvedMotorCount > 1 ? idx + 1 : ""}`.trim()}
                  value={draftMotorIds[idx] ?? ""}
                  placeholder={CASTING_CURING_FLOW_LABELS.motorIdPlaceholder}
                  options={getMotorOptionsForSlot(idx)}
                  width={280}
                  theme={theme}
                  onChange={(value) => onDraftMotorIdChange(idx, value)}
                />
              ))}
            </Box>
          </Box>
        ) : null}

        {!schemasReady ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="small"
              onClick={onStartForm}
              disabled={!canStart || schemaLoading}
              startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {schemaLoading
                ? CASTING_CURING_FLOW_LABELS.schemaLoading
                : CASTING_CURING_FLOW_LABELS.startForm}
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default CastingCuringFlowBar;
