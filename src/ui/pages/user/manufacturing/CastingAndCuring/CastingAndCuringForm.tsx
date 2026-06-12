import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";
import {
  canStartCastingCuringForm,
  resolveCastingCuringMotorOptions,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import type {
  CastingCuringFormState,
  CastingCuringMotorSession,
} from "../../../../../data/models/user/CastingCuringFormModel";
import CastingCuringFlowBar from "./CastingCuringFlowBar";
import CastingCuringSchemaPanel from "./CastingCuringSchemaPanel";

const S = STRINGS.MANUFACTURING.CASTING_CURING;
const { thermostat: ThermostatRoundedIcon } = icons.user.manufacturing.castingAndCuring.form;

type CastingAndCuringFormProps = {
  batch?: {
    batchId?: string;
    projectName?: string;
    motorId?: string;
    motorIds?: string[];
    motorStage?: unknown;
    motorType?: unknown;
  } | null;
  formData: CastingCuringFormState;
  castingType: string;
  castingStation: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  addedMotors: Array<{ motorId: string; motorReceivedAt: string }>;
  schemaLoading?: boolean;
  schemaError?: string | null;
  castingSchemaError?: string | null;
  curingSchemaError?: string | null;
  subDepartmentId?: number;
  onCastingTypeChange: (value: string) => void;
  onCastingStationChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onMotorReceivedAtChange: (value: string) => void;
  onStartForm: () => void;
  onMotorSessionChange: (motorId: string, next: CastingCuringMotorSession) => void;
  onCuringValuesChange: (values: CastingCuringFormState["curingFormValues"]) => void;
  theme: any;
};

const CastingAndCuringForm = ({
  batch,
  formData,
  castingType,
  castingStation,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  addedMotors,
  schemaLoading = false,
  schemaError = null,
  castingSchemaError = null,
  curingSchemaError = null,
  subDepartmentId,
  onCastingTypeChange,
  onCastingStationChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onMotorReceivedAtChange,
  onStartForm,
  onMotorSessionChange,
  onCuringValuesChange,
  theme,
}: CastingAndCuringFormProps) => {
  const BRAND = CASTING_CURING_BRAND;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const schemasReady = Boolean(formData.castingSchema || formData.curingSchema);

  const availableMotorOptions = useMemo(() => resolveCastingCuringMotorOptions(batch), [batch]);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      return;
    }
    setActiveMotorIndex((prev) => Math.min(prev, motorCards.length - 1));
  }, [motorCards.length]);

  const activeMotorEntry = motorCards[activeMotorIndex] ?? motorCards[0] ?? null;
  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((motor) => motor.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);
  const showCastingPanel = Boolean(formData.castingSchema && activeMotorEntry && activeMotorSession);
  const showCuringPanel = Boolean(formData.curingSchema);

  const usedMotorIds = motorCards.map((motor) => motor.motorId);
  const canStart = canStartCastingCuringForm({
    castingType,
    castingStation,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    usedMotorIds,
    schemasReady,
    availableMotorOptions,
  });

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "11px",
            background: "linear-gradient(135deg,#1565C0,#1976D2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
          }}
        >
          <ThermostatRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>
            {S.FORM_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
            {batch?.projectName
              ? `${batch.projectName} · ${batch.batchId ?? ""}`
              : batch?.batchId ?? S.FORM_SUBTITLE}
          </Typography>
        </Box>
      </Stack>

      <CastingCuringFlowBar
        castingType={castingType}
        castingStation={castingStation}
        motorCount={motorCount}
        draftMotorIds={draftMotorIds}
        motorReceivedAt={motorReceivedAt}
        availableMotorOptions={availableMotorOptions}
        usedMotorIds={usedMotorIds}
        schemasReady={schemasReady}
        onCastingTypeChange={onCastingTypeChange}
        onCastingStationChange={onCastingStationChange}
        onMotorCountChange={onMotorCountChange}
        onDraftMotorIdChange={onDraftMotorIdChange}
        onMotorReceivedAtChange={onMotorReceivedAtChange}
        onStartForm={onStartForm}
        schemaLoading={schemaLoading}
        theme={theme}
      />

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger, mb: 2 }}>{schemaError}</Typography>
      ) : null}

      {showCastingPanel ? (
        <Stack spacing={1.25} mt={2}>
          {motorCards.length > 1 ? (
            <Box
              sx={{
                border: `1px solid ${theme.palette.border}`,
                borderRadius: 2,
                px: 1,
                py: 1,
                background: theme.palette.surface,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                {motorCards.map((entry, idx) => (
                  <Button
                    key={`cc-motor-tab-${entry.motorId}`}
                    size="small"
                    variant={idx === activeMotorIndex ? "contained" : "outlined"}
                    onClick={() => setActiveMotorIndex(idx)}
                    sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
                  >
                    {entry.motorId}
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : null}

          <Box
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.border}`,
              background: theme.palette.surface,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary, mb: 1 }}>
              {S.CASTING_SECTION_TITLE} — {activeMotorEntry.motorId}
            </Typography>
            <CastingCuringSchemaPanel
              schema={formData.castingSchema}
              formValues={activeMotorSession.formValues}
              savedSections={activeMotorSession.savedSections}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              onChange={(values) =>
                onMotorSessionChange(activeMotorEntry.motorId, {
                  ...activeMotorSession,
                  formValues: values,
                })
              }
              loading={schemaLoading}
              error={castingSchemaError}
            />
          </Box>
        </Stack>
      ) : null}

      {showCuringPanel ? (
        <Box
          sx={{
            mt: 2,
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary, mb: 1 }}>
            {S.CURING_SECTION_TITLE}
          </Typography>
          <CastingCuringSchemaPanel
            schema={formData.curingSchema}
            formValues={formData.curingFormValues ?? {}}
            savedSections={formData.curingSavedSections}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            onChange={onCuringValuesChange}
            loading={schemaLoading}
            error={curingSchemaError}
          />
        </Box>
      ) : null}

      {schemasReady && !showCastingPanel && !showCuringPanel ? (
        <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, mt: 2 }}>
          Schemas loaded, but no form sections are available to render.
        </Typography>
      ) : null}

      {!schemasReady && !canStart ? (
        <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, mt: 2 }}>
          Select casting type, station, motors, and received date/time, then load the form.
        </Typography>
      ) : null}
    </Box>
  );
};

export default CastingAndCuringForm;
