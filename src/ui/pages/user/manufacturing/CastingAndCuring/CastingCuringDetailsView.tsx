import React, { Component, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ThermostatRoundedIcon from "@mui/icons-material/ThermostatRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import AcUnitRoundedIcon from "@mui/icons-material/AcUnitRounded";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { CC_STATUS_CONFIG, CC_STATUS } from "./CastingAndCuringList";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";

class DetailsErrorBoundary extends Component<
  { children: React.ReactNode; onBack: () => void },
  { hasError: boolean; error: Error | null; stack: string }
> {
  constructor(props: { children: React.ReactNode; onBack: () => void }) {
    super(props);
    this.state = { hasError: false, error: null, stack: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ stack: info.componentStack ?? "" });
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: BRAND.notOk, mb: 1 }}>
            Something went wrong rendering the details view.
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.textSub, mb: 2, fontFamily: "monospace", whiteSpace: "pre-wrap", textAlign: "left" }}>
            Error: {this.state.error?.message}
          </Typography>
          {this.state.stack && (
            <Typography sx={{ fontSize: "0.65rem", color: BRAND.textSub, mb: 2, fontFamily: "monospace", whiteSpace: "pre-wrap", textAlign: "left", maxHeight: 200, overflow: "auto" }}>
              {this.state.stack}
            </Typography>
          )}
          <Button variant="outlined" size="small" onClick={this.props.onBack}>
            Back to list
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

const S = STRINGS.MANUFACTURING;
const FH = STRINGS.MANUFACTURING.FORM_HEADER;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  accentLight: "#1ABC9C",
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

const rowBg = (i: number) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));

const fmt = (id: string) =>
  String(id ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

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

const DataTable = ({ rows, label }: { rows: Record<string, any>[]; label?: string }) => {
  const cols = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r))),
  ).map((k) => ({ key: k, label: fmt(k) }));
  if (cols.length === 0) return null;
  return (
    <TableContainer sx={{ borderRadius: 1, border: `1px solid ${BRAND.border}`, mb: 0.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {cols.map((c) => (
              <TableCell key={c.key} sx={{ background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`, color: "#fff", fontWeight: 700, fontSize: "0.6rem", px: 1, py: 0.5, whiteSpace: "nowrap", borderBottom: "none" }}>{c.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri) }}>
              {cols.map((c) => (
                <TableCell key={c.key} sx={{ fontSize: "0.68rem", px: 1, py: 0.5, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                  {renderFieldValue(row[c.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
    <Box sx={{ mb: 2, borderRadius: "8px", border: `1px solid ${BRAND.border}`, overflow: "hidden", background: "#fff" }}>
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

const MotorSetupInfo = ({ motor, type = "casting" }: { motor: any; type?: "casting" | "curing" }) => {
  if (!motor) return null;
  if (type === "curing") {
    if (!motor.motorReceivedAt && !motor.curingSetup?.oven && !motor.curingSetup?.curingType) return null;
    return (
      <Box sx={{ p: 1.5, borderRadius: 1, background: alpha(BRAND.cc, 0.03), border: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: BRAND.textSub, mb: 0.5 }}>Curing Setup Info</Typography>
        {motor.motorReceivedAt && (
          <Stack direction="row" sx={{ py: 0.2 }}>
            <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Motor Received At</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{motor.motorReceivedAt}</Typography>
          </Stack>
        )}
        {motor.curingSetup?.oven && (
          <Stack direction="row" sx={{ py: 0.2 }}>
            <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Oven</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{motor.curingSetup.oven}</Typography>
          </Stack>
        )}
        {motor.curingSetup?.curingType && (
          <Stack direction="row" sx={{ py: 0.2 }}>
            <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Curing Type</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{motor.curingSetup.curingType}</Typography>
          </Stack>
        )}
        {motor.curingSetup?.configuration && (
          <Stack direction="row" sx={{ py: 0.2 }}>
            <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Configuration</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{motor.curingSetup.configuration}</Typography>
          </Stack>
        )}
        {motor.curingSetup?.motorsToCureCount !== "" && motor.curingSetup?.motorsToCureCount != null && (
          <Stack direction="row" sx={{ py: 0.2 }}>
            <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Motors to Cure</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{String(motor.curingSetup.motorsToCureCount)}</Typography>
          </Stack>
        )}
        {motor.curingSetup?.ovensUtilized && (
          <Stack direction="row" sx={{ py: 0.2 }}>
            <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Ovens Utilized</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{motor.curingSetup.ovensUtilized}</Typography>
          </Stack>
        )}
      </Box>
    );
  }
  if (!motor.motorReceivedAt && !motor.setup?.castingType && !motor.setup?.castingStation) return null;
  return (
    <Box sx={{ p: 1.5, borderRadius: 1, background: alpha(BRAND.cc, 0.03), border: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
      <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: BRAND.textSub, mb: 0.5 }}>Setup Info</Typography>
      {motor.motorReceivedAt && (
        <Stack direction="row" sx={{ py: 0.2 }}>
          <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Motor Received At</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{motor.motorReceivedAt}</Typography>
        </Stack>
      )}
      {motor.setup?.castingType && (
        <Stack direction="row" sx={{ py: 0.2 }}>
          <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Casting Type</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{motor.setup.castingType}</Typography>
        </Stack>
      )}
      {motor.setup?.castingStation && (
        <Stack direction="row" sx={{ py: 0.2 }}>
          <Typography sx={{ minWidth: 160, fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>Casting Station</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>{motor.setup.castingStation}</Typography>
        </Stack>
      )}
    </Box>
  );
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type CastingCuringDetailsViewProps = {
  row: any;
  data: any;
  loading: boolean;
  onBack: () => void;
};

const CastingCuringDetailsView = ({ row, data, loading, onBack }: CastingCuringDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);

  const statusConfig: Record<string, any> = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(CC_STATUS_CONFIG).map(([status, cfg]) => [status, { ...cfg, ...theme.batchList?.statusConfig?.[status] }]),
      ),
    [theme],
  );

  const detail = data?.castingCuringDetails ?? data ?? {};
  const motors = Array.isArray(detail.motors) ? detail.motors : [];

  return (
    <DetailsErrorBoundary onBack={onBack}>
    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={theme.workflow.formHeader.backButton}
        >
          {FH.BACK_TO_LIST}
        </Button>
      </Stack>

      <Box sx={{ borderRadius: 3, border: `1px solid ${BRAND.border}`, overflow: "hidden", boxShadow: `0 2px 12px ${alpha(BRAND.primary, 0.06)}` }}>
        {/* Banner */}
        <Box sx={{ p: "14px 20px", background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <ThermostatRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                {S.CASTING_CURING.TITLE}
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {data?.batchId || row?.batchId}
                {row?.batchType ? ` · ${row.batchType}` : ""}
                {loading ? " · loading…" : ""}
              </Typography>
            </Box>
          </Stack>
          <UserWorkflowStatusCell
            status={row?.ccStatus}
            statusConfig={statusConfig}
            rejectedStatus={CC_STATUS.REJECTED}
            rejectionReason={row?.rejectionReason ?? null}
            theme={theme}
          />
        </Box>

        {/* Content */}
        <Box sx={{ p: 2.5, background: BRAND.surface }}>
          {loading ? (
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
              {/* Batch Info */}
              <Box sx={{ borderRadius: "8px", border: `1px solid ${BRAND.border}`, overflow: "hidden", background: "#fff" }}>
                <Box sx={{ px: 2, py: 1, background: alpha(BRAND.cc, 0.04), borderBottom: `1px solid ${BRAND.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                  <DescriptionRoundedIcon sx={{ fontSize: 16, color: BRAND.cc }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: BRAND.cc }}>
                    Batch Information
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                      <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                        {S.BATCH_LIST.COL_BATCH_ID}
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                        {data?.batchId || row?.batchId || "—"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ py: 0.3, borderBottom: `1px solid ${alpha(BRAND.border, 0.3)}` }}>
                      <Typography sx={{ minWidth: 220, fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                        Form ID
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                        {data?.formId || row?.formId || "—"}
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
                        Priority
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: BRAND.text }}>
                        {row?.priority || "—"}
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
                          {formatDate(detail.createdAt)}
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
                          {formatDate(detail.lastUpdatedAt)}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Box>

              {/* Casting Section */}
              <Box sx={{ borderRadius: "8px", border: `1px solid ${BRAND.border}`, overflow: "hidden", background: "#fff" }}>
                <Box sx={{ px: 2, py: 1, background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`, display: "flex", alignItems: "center", gap: 1 }}>
                  <LocalFireDepartmentRoundedIcon sx={{ fontSize: 16, color: "#fff" }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#fff" }}>
                    Casting Section
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  {motors.filter((m) => Array.isArray(m.castingSections) && m.castingSections.length > 0).length === 0 ? (
                    <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, fontStyle: "italic" }}>
                      No casting data recorded.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {motors.map((motor, i) => {
                        const castingSections = Array.isArray(motor.castingSections) ? motor.castingSections : [];
                        if (castingSections.length === 0) return null;
                        return (
                          <Box key={motor.motorId ?? i}>
                            <Stack direction="row" alignItems="center" gap={1} mb={1}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: BRAND.primary }}>
                                Motor {i + 1}: {motor.motorId || "—"}
                              </Typography>
                              {motor.motorStage != null && (
                                <Chip label={`Stage ${motor.motorStage}`} size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, background: alpha(BRAND.ccLight, 0.1), color: BRAND.ccLight, border: `1px solid ${alpha(BRAND.ccLight, 0.22)}` }} />
                              )}
                            </Stack>
                            <MotorSetupInfo motor={motor} />
                            <Box sx={{ mt: 1 }}>
                              {castingSections.map((sec) => (
                                <SectionRenderer key={sec.sectionId} section={sec} />
                              ))}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Box>

              {/* Curing Section */}
              <Box sx={{ borderRadius: "8px", border: `1px solid ${BRAND.border}`, overflow: "hidden", background: "#fff" }}>
                <Box sx={{ px: 2, py: 1, background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`, display: "flex", alignItems: "center", gap: 1 }}>
                  <AcUnitRoundedIcon sx={{ fontSize: 16, color: "#fff" }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#fff" }}>
                    Curing Section
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  {motors.filter((m) => Array.isArray(m.curingSections) && m.curingSections.length > 0).length === 0 ? (
                    <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, fontStyle: "italic" }}>
                      No curing data recorded.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {motors.map((motor, i) => {
                        const curingSections = Array.isArray(motor.curingSections) ? motor.curingSections : [];
                        if (curingSections.length === 0) return null;
                        return (
                          <Box key={motor.motorId ?? i}>
                            <Stack direction="row" alignItems="center" gap={1} mb={1}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: BRAND.primary }}>
                                Motor {i + 1}: {motor.motorId || "—"}
                              </Typography>
                              {motor.motorStage != null && (
                                <Chip label={`Stage ${motor.motorStage}`} size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, background: alpha(BRAND.ccLight, 0.1), color: BRAND.ccLight, border: `1px solid ${alpha(BRAND.ccLight, 0.22)}` }} />
                              )}
                            </Stack>
                            <MotorSetupInfo motor={motor} type="curing" />
                            <Box sx={{ mt: 1 }}>
                              {curingSections.map((sec) => (
                                <SectionRenderer key={sec.sectionId} section={sec} />
                              ))}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Box>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
    </DetailsErrorBoundary>
  );
};

export default CastingCuringDetailsView;
