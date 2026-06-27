// src/ui/pages/approver/manufacturing/CastingCuring/CastingCuringApproverPage.jsx

import React, { useState, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  alpha,
  Card,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { ReportPreviewDialog } from "../components/ReportPdf";
import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { icons } from "../../../../app/theme/icons";
import {
  APPROVER_PRIORITY_META,
  APPROVER_STATUS_META,
  isApproverActionableStatus,
} from "../../../../app/theme/approver";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";
import castingCuringController from "../../../../controllers/user/manufacturing/castingCuringController";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  thermostat: ThermostatRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.castingAndCuring;

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  accentLight: "#1ABC9C",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  cc: "#1565C0",
  ccLight: "#1976D2",
  ok: "#1B5E20",
  okBg: "rgba(27,94,32,0.08)",
  okBorder: "rgba(27,94,32,0.25)",
  notOk: "#B71C1C",
  notOkBg: "rgba(183,28,28,0.08)",
  notOkBorder: "rgba(183,28,28,0.25)",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status / Priority meta ───────────────────────────────────────────────────
export const CC_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;

// ─── Styled components ────────────────────────────────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "10px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
});

const TD = styled(TableCell)({
  padding: "10px 14px",
  fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

const DTH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.65rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "10px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
  verticalAlign: "middle",
});

const DTD = styled(TableCell)({
  padding: "10px 14px",
  fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rowBg = (i: number) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));

const fmt = (id: string) =>
  String(id ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

// ─── Small display components ─────────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: CC_STATUS_META[status]?.bg,
      color: CC_STATUS_META[status]?.color,
      border: `1px solid ${CC_STATUS_META[status]?.border}`,
    }}
  />
);

const PriorityChip = ({ priority }) => (
  <Chip
    label={priority}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: PRIORITY_META[priority]?.bg,
      color: PRIORITY_META[priority]?.color,
      border: `1px solid ${PRIORITY_META[priority]?.border}`,
    }}
  />
);

const isDataTable = (arr: any[]): boolean => {
  if (arr.length === 0) return true;
  return arr.every(
    (item) =>
      typeof item === "object" &&
      !Array.isArray(item) &&
      item !== null &&
      !Object.values(item).some((v) => Array.isArray(v)),
  );
};

const renderFieldValue = (value: any): React.ReactNode => {
  if (value == null || value === "") return <Typography sx={{ fontSize: "0.72rem", color: alpha(BRAND.textSub, 0.45), fontStyle: "italic" }}>—</Typography>;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "ok") return <Chip label="OK" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, background: BRAND.okBg, color: BRAND.ok, border: `1.5px solid ${BRAND.okBorder}` }} />;
    if (lower === "notok" || lower === "not ok") return <Chip label="Not OK" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, background: BRAND.notOkBg, color: BRAND.notOk, border: `1.5px solid ${BRAND.notOkBorder}` }} />;
    return <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: BRAND.text }}>{value}</Typography>;
  }
  if (typeof value === "number" || typeof value === "boolean")
    return <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: BRAND.text }}>{String(value)}</Typography>;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    const allItems = value.filter((x) => x != null && typeof x === "object" && !Array.isArray(x));
    if (allItems.length === 0) return null;
    if (isDataTable(allItems)) return <DataTable rows={allItems} />;
    return value.map((entry, ei) => renderFieldEntry(entry, ei));
  }
  return <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: BRAND.text }}>{String(value)}</Typography>;
};

const DataTable = ({ rows }: { rows: Record<string, any>[] }) => {
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).map((k) => ({ key: k, label: fmt(k) }));
  if (cols.length === 0) return null;
  return (
    <TableContainer sx={{ borderRadius: 1, border: `1px solid ${BRAND.border}`, mb: 0.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {cols.map((c) => (
              <DTH key={c.key} sx={{ fontSize: "0.6rem", px: 1, py: 0.5 }}>{c.label}</DTH>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri) }}>
              {cols.map((c) => (
                <DTD key={c.key} sx={{ fontSize: "0.68rem", px: 1, py: 0.5 }}>{renderFieldValue(row[c.key])}</DTD>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const renderFieldEntry = (entry: any, index: number): React.ReactNode => {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  return (
    <Box key={index} sx={{ mb: 1, p: 1, borderRadius: 1, border: `1px solid ${alpha(BRAND.border, 0.5)}`, background: alpha(BRAND.surface, 0.3) }}>
      {Object.entries(entry).map(([key, val]) => (
        <Box key={key} sx={{ mb: 0.5 }}>
          {Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && !Array.isArray(val[0]) && !isDataTable(val as any[]) ? (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: "0.7rem", color: BRAND.cc, mb: 0.3 }}>{fmt(key)}</Typography>
              {(val as any[]).map((sub, si) => renderFieldEntry(sub, si))}
            </>
          ) : (
            <FieldRow label={key} value={val} />
          )}
        </Box>
      ))}
    </Box>
  );
};

const FieldRow = ({ label, value }: { label: string; value: any }) => (
  <Stack direction="row" sx={{ py: 0.2 }}>
    <Typography sx={{ minWidth: 180, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>{fmt(label)}</Typography>
    <Box sx={{ flex: 1 }}>{renderFieldValue(value)}</Box>
  </Stack>
);

const SectionRenderer = ({ section }: { section: any }) => {
  if (!section) return null;
  const { sectionId, sectionData } = section;
  if (!Array.isArray(sectionData) || sectionData.length === 0) return null;
  const row = sectionData[0];
  if (!row || typeof row !== "object") return null;
  const entries = Object.entries(row).filter(([, v]) => v != null);
  if (entries.length === 0) return null;
  return (
    <Box sx={{ mb: 1.5, borderRadius: "8px", border: `1px solid ${BRAND.border}`, overflow: "hidden", background: "#fff" }}>
      <Box sx={{ px: 2, py: 1, background: alpha(BRAND.cc, 0.04), borderBottom: `1px solid ${BRAND.border}` }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: BRAND.cc }}>{fmt(sectionId)}</Typography>
      </Box>
      <Box sx={{ p: 1.5 }}>
        {entries.map(([key, val]) => (
          <Box key={key} sx={{ mb: 0.5 }}>
            {Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && !Array.isArray(val[0]) && !isDataTable(val as any[]) ? (
              <>
                <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: BRAND.cc, mb: 0.3 }}>{fmt(key)}</Typography>
                {(val as any[]).map((entry, ei) => renderFieldEntry(entry, ei))}
              </>
            ) : (
              <FieldRow label={key} value={val} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const MotorIdHeader = ({ label, id }) => (
  <Stack gap={0.4}>
    <Typography
      sx={{
        fontSize: "0.58rem",
        fontWeight: 700,
        color: "rgba(255,255,255,0.7)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </Typography>
    <Chip
      label={id || "—"}
      size="small"
      sx={{
        height: 22,
        fontSize: "0.7rem",
        fontWeight: 800,
        background: "rgba(255,255,255,0.18)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.35)",
      }}
    />
  </Stack>
);

const SectionDivider = ({ icon: Icon, label }) => (
  <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "8px",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon sx={{ color: "#fff", fontSize: 14 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: BRAND.cc, letterSpacing: "0.04em" }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: "1px", background: alpha(BRAND.cc, 0.18) }} />
  </Stack>
);

// ─── Dynamic section renderer for schema sections ────────────────────────────


const MotorSectionsCard = ({ motor, index }) => {
  const castingSections = Array.isArray(motor.castingSections) ? motor.castingSections : [];
  const curingSections = Array.isArray(motor.curingSections) ? motor.curingSections : [];
  const hasSetupData = motor.motorReceivedAt || motor.setup?.castingType || motor.setup?.castingStation;
  const hasAnySection = castingSections.length > 0 || curingSections.length > 0;

  if (!hasSetupData && !hasAnySection) return null;

  return (
    <Box sx={{ borderRadius: "8px", border: `1px solid ${BRAND.border}`, overflow: "hidden", background: "#fff" }}>
      <Box
        sx={{
          px: 2,
          py: 1.2,
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#fff" }}>
          Motor {index + 1}: {motor.motorId || "—"}
        </Typography>
        {motor.motorStage != null && (
          <Chip
            label={`Stage ${motor.motorStage}`}
            size="small"
            sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, background: alpha("#fff", 0.2), color: "#fff" }}
          />
        )}
      </Box>
      <Box sx={{ p: 2 }}>
        {hasSetupData && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 1,
              background: alpha(BRAND.cc, 0.03),
              border: `1px solid ${alpha(BRAND.border, 0.5)}`,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: BRAND.textSub, mb: 0.5 }}>
              Casting Setup Info
            </Typography>
            {motor.motorReceivedAt && <DetailRowSmall label="Motor Received At" value={motor.motorReceivedAt} />}
            {motor.setup?.castingType && <DetailRowSmall label="Casting Type" value={motor.setup.castingType} />}
            {motor.setup?.castingStation && (
              <DetailRowSmall label="Casting Station" value={motor.setup.castingStation} />
            )}
          </Box>
        )}
        {motor.curingSetup?.oven || motor.curingSetup?.curingType ? (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 1,
              background: alpha(BRAND.cc, 0.03),
              border: `1px solid ${alpha(BRAND.border, 0.5)}`,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: BRAND.textSub, mb: 0.5 }}>
              Curing Setup Info
            </Typography>
            {motor.curingSetup?.oven && <DetailRowSmall label="Oven" value={motor.curingSetup.oven} />}
            {motor.curingSetup?.curingType && <DetailRowSmall label="Curing Type" value={motor.curingSetup.curingType} />}
            {motor.curingSetup?.configuration && <DetailRowSmall label="Configuration" value={motor.curingSetup.configuration} />}
            {motor.curingSetup?.motorsToCureCount !== "" && motor.curingSetup?.motorsToCureCount != null && (
              <DetailRowSmall label="Motors to Cure" value={String(motor.curingSetup.motorsToCureCount)} />
            )}
            {motor.curingSetup?.ovensUtilized && <DetailRowSmall label="Ovens Utilized" value={motor.curingSetup.ovensUtilized} />}
          </Box>
        ) : null}
        <Stack spacing={0.5}>
          {castingSections.map((sec) => (
            <SectionRenderer key={sec.sectionId} section={sec} />
          ))}
          {curingSections.map((sec) => (
            <SectionRenderer key={sec.sectionId} section={sec} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

const DetailRowSmall = ({ label, value }) => (
  <Stack direction="row" sx={{ py: 0.2 }}>
    <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>{label}</Typography>
    <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{value != null ? String(value) : "—"}</Typography>
  </Stack>
);

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const CastingCuringDetailDialog = ({ open, onClose, item, detailData, detailsLoading, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const detail = detailData ?? item;
  const motors = detail?.motors ?? [];
  const motorIds = motors.map((m) => m.motorId).filter(Boolean);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "94vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            m: 2,
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            p: "14px 20px",
            background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <ThermostatRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Casting & Curing Record
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {item.formId}
                {detailsLoading ? " · loading…" : ""}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" gap={1} alignItems="center">
            {detailsLoading && <CircularProgress size={16} sx={{ color: alpha("#fff", 0.7) }} />}
            <Button
              size="small"
              variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.72rem",
                textTransform: "none",
                px: 1.6,
                py: "5px",
                whiteSpace: "nowrap",
                background: alpha("#fff", 0.18),
                color: "#fff",
                border: `1px solid ${alpha("#fff", 0.3)}`,
                backdropFilter: "blur(8px)",
                "&:hover": { background: alpha("#fff", 0.28), boxShadow: "none" },
                boxShadow: "none",
              }}
            >
              View as PDF
            </Button>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: alpha("#fff", 0.8), "&:hover": { background: alpha("#fff", 0.1) } }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* ── Motor ID strip ── */}
        {motorIds.length > 0 && (
          <Box
            sx={{
              px: 2.5,
              py: 1,
              background: alpha(BRAND.cc, 0.04),
              borderBottom: `1px solid ${BRAND.border}`,
              flexShrink: 0,
            }}
          >
            <Stack direction="row" gap={3} alignItems="center" flexWrap="wrap">
              <Stack direction="row" gap={0.7} alignItems="center">
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub }}>Motor IDs:</Typography>
                {motorIds.map((id) => (
                  <Chip
                    key={id}
                    label={id}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      background: alpha(BRAND.cc, 0.08),
                      color: BRAND.cc,
                      border: `1px solid ${alpha(BRAND.cc, 0.22)}`,
                    }}
                  />
                ))}
              </Stack>
              {motors.some((m) => m.motorStage != null) && (
                <Stack direction="row" gap={0.7} alignItems="center">
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub }}>Stages:</Typography>
                  {motors.map(
                    (m) =>
                      m.motorStage != null && (
                        <Chip
                          key={m.motorId}
                          label={`Stage ${m.motorStage}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            background: alpha(BRAND.ccLight, 0.1),
                            color: BRAND.ccLight,
                            border: `1px solid ${alpha(BRAND.ccLight, 0.22)}`,
                          }}
                        />
                      ),
                  )}
                </Stack>
              )}
            </Stack>
          </Box>
        )}

        {/* ── Content ── */}
        <DialogContent sx={{ p: 2.5, overflowY: "auto", background: BRAND.surface }}>
          {detailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !motors.length ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
                No motor data available for this submission.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {/* ── Batch Info ── */}
              <Box
                sx={{
                  borderRadius: "8px",
                  border: `1px solid ${BRAND.border}`,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <Box
                  sx={{ px: 2, py: 1, background: alpha(BRAND.cc, 0.04), borderBottom: `1px solid ${BRAND.border}` }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: BRAND.cc }}>
                    Batch Information
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                      <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                        Batch ID
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                        {item.batchId}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                      <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                        Form ID
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                        {item.formId}
                      </Typography>
                    </Stack>
                    {detail.project?.projectId && (
                      <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                        <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                          Project ID
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                          {detail.project.projectId}
                        </Typography>
                      </Stack>
                    )}
                    {detail.project?.projectName && (
                      <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                        <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                          Project Name
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                          {detail.project.projectName}
                        </Typography>
                      </Stack>
                    )}
                    <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                      <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                        Status
                      </Typography>
                      <StatusChip status={item.status} />
                    </Stack>
                    <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                      <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                        Submitted By
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                        {item.submittedBy}
                      </Typography>
                    </Stack>
                    {detail.createdBy && (
                      <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                        <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                          Created By
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                          {detail.createdBy}
                        </Typography>
                      </Stack>
                    )}
                    {detail.createdAt && (
                      <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                        <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                          Created At
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                          {new Date(detail.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Stack>
                    )}
                    {detail.lastUpdatedBy && (
                      <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                        <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                          Last Updated By
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                          {detail.lastUpdatedBy}
                        </Typography>
                      </Stack>
                    )}
                    {detail.lastUpdatedAt && (
                      <Stack direction="row" sx={{ py: 0.3 }}>
                        <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                          Last Updated At
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                          {new Date(detail.lastUpdatedAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Box>

              {/* ── Motor sections ── */}
              {motors.map((motor, i) => (
                <MotorSectionsCard key={motor.motorId ?? i} motor={motor} index={i} />
              ))}
            </Stack>
          )}
        </DialogContent>

        {/* ── Footer ── */}
        <Box
          sx={{
            p: "12px 20px",
            background: "#fff",
            borderTop: `1px solid ${BRAND.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<CancelRoundedIcon />}
            onClick={() => onReject(item)}
            sx={{ background: BRAND.danger, "&:hover": { background: "#922B21" } }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={() => onApprove(item)}
            sx={{
              background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentLight})`,
              "&:hover": { background: BRAND.accent },
            }}
          >
            Approve
          </Button>
        </Box>
      </Dialog>

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.formId}
        department="manufacturing"
        subDepartment="casting-and-curing"
        dialogTitle={`Casting & Curing Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CastingCuringApproverPage = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems,
    setSelected,
    subDepartment: "casting-and-curing",
  });

  const handleViewDetails = useCallback(async (row) => {
    setSelected(row);
    setDetailData(null);
    setDetailsLoading(true);
    try {
      const response = await castingCuringController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId: 6,
      });
      if (response?.success && response?.data) {
        setDetailData(response.data);
      }
    } catch {
      setDetailData(null);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setSelected(null);
    setDetailData(null);
  }, []);

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="casting-and-curing"
      items={items}
      statusField="status"
      statusMeta={CC_STATUS_META}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      filterFields={[
        { field: "motorStage", label: "Type", options: ["A", "B", "C"] },
      ]}
    >
      {(filtered) => (
        <>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${BRAND.border}`,
              boxShadow: `0 2px 12px ${alpha(BRAND.primary, 0.06)}`,
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TH>Batch ID</TH>
                    <TH>Motor ID</TH>
                    <TH>Type</TH>
                    <TH>Submitted By</TH>
                    <TH>Date</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      sx={{
                        background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5),
                        "&:hover": { background: alpha(BRAND.primaryLight, 0.04) },
                        "&:last-child td": { borderBottom: "none" },
                        animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                      }}
                    >
                      <TD>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.cc }}>
                          {row.batchId}
                        </Typography>
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>
                      <TD>
                        <Chip
                          label={`Type ${row.motorStage ?? row.motorType ?? ""}`}
                          size="small"
                          sx={{
                            background: alpha(BRAND.ccLight, 0.1),
                            color: BRAND.ccLight,
                            border: `1px solid ${alpha(BRAND.ccLight, 0.2)}`,
                          }}
                        />
                      </TD>
                      <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>
                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem" }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TD>
                      <TD>
                        <StatusChip status={row.status} />
                      </TD>
                      <TD sx={{ textAlign: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          onClick={() => handleViewDetails(row)}
                          disabled={!isApproverActionableStatus(row.status)}
                          sx={{
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.cc : BRAND.border,
                            color: isApproverActionableStatus(row.status) ? BRAND.cc : alpha(BRAND.textSub, 0.4),
                          }}
                        >
                          View Details
                        </Button>
                      </TD>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <CastingCuringDetailDialog
            open={!!selected}
            onClose={closeDetails}
            item={selected}
            detailData={detailData}
            detailsLoading={detailsLoading}
            onApprove={requestApprove}
            onReject={requestReject}
          />

          <ApproverActionDialog {...dialogProps} />
        </>
      )}
    </ApproverList>
  );
};

export default CastingCuringApproverPage;
