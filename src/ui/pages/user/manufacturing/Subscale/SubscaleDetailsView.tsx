import React from "react";
import {
  Box,
  Button,
  Card,
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
import { icons } from "../../../../../app/theme/icons";

const { scale: ScaleRoundedIcon } = icons.approver.manufacturing.subscale;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  ss: "#1565C0",
  ssLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

const sectionName = (id: string) =>
  id
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const fieldLabel = (key: string) =>
  key.replace(/_/g, " ");

const isArrayField = (key: string) =>
  key.endsWith("_TABLE") || key === "CASTING_TABLE" || key === "CURING_TABLE" ||
  key === "NDT_TABLE" || key === "TRIMMING_TABLE" || key === "INHIBITION_TABLE" ||
  key === "MECHANICAL_PROPERTIES_TABLE" || key === "STATIC_TESTING_TABLE";

const DynamicTable = ({ rows }: { rows: Record<string, any>[] }) => {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  return (
    <TableContainer sx={{ mt: 1, mb: 1.5, border: `1px solid ${alpha(BRAND.ss, 0.2)}`, borderRadius: 1.5, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: alpha(BRAND.ss, 0.08) }}>
            {cols.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 700, fontSize: "0.62rem", color: BRAND.ss, px: 1.5, py: 0.8, whiteSpace: "nowrap" }}>
                {fieldLabel(col)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: ri % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5) }}>
              {cols.map((col) => (
                <TableCell key={col} sx={{ fontSize: "0.72rem", px: 1.5, py: 0.8 }}>
                  {String(row[col] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const SectionRenderer = ({ section }: { section: { sectionId: string; sectionData: Record<string, any>[] } }) => {
  const entries = section.sectionData ?? [];
  const simpleKeys = entries.length > 0
    ? Object.keys(entries[0]).filter((k) => !k.startsWith("_") && !isArrayField(k))
    : [];
  const tableKeys = entries.length > 0
    ? Object.keys(entries[0]).filter((k) => isArrayField(k))
    : [];

  if (!entries.length) return null;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box
        sx={{
          px: 1.5, py: 1, mb: 1,
          background: alpha(BRAND.ss, 0.06),
          borderRadius: 1,
          borderLeft: `3px solid ${BRAND.ss}`,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.ss }}>
          {sectionName(section.sectionId)}
        </Typography>
      </Box>

      {simpleKeys.length > 0 && (
        <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1, mb: 1 }}>
          <Table size="small">
            <TableBody>
              {simpleKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, px: 1.5, py: 0.6, width: 220, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                    {fieldLabel(key)}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: BRAND.text, px: 1.5, py: 0.6, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                    {String(entries[0][key] ?? "—")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tableKeys.map((key) => {
        const data = entries[0][key];
        if (!Array.isArray(data) || !data.length) return null;
        return (
          <Box key={key} sx={{ mb: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.68rem", color: BRAND.textSub, mb: 0.5 }}>
              {fieldLabel(key)}
            </Typography>
            <DynamicTable rows={data} />
          </Box>
        );
      })}
    </Box>
  );
};

type SubscaleDetailsViewProps = {
  row: any;
  data: any;
  loading: boolean;
  onBack: () => void;
};

const SubscaleDetailsView = ({ row, data, loading, onBack }: SubscaleDetailsViewProps) => {
  const sections = data?.sections ?? [];

  return (
    <Box sx={{ py: 3, px: 2 }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        sx={{ mb: 2, color: BRAND.ss, fontWeight: 600, fontSize: "0.82rem" }}
      >
        Back to List
      </Button>

      <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.surface }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: "10px",
                background: `linear-gradient(135deg,${BRAND.ss},${BRAND.ssLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ScaleRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: BRAND.text }}>
                {row.batchId}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                {row.motorId}
              </Typography>
            </Box>
            <Box sx={{ ml: "auto" }}>
              <Chip label={row.ssStatus} size="small" sx={{ height: 24, fontWeight: 700, fontSize: "0.68rem" }} />
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          ) : sections.length > 0 ? (
            sections.map((section: any) => (
              <SectionRenderer key={section.sectionId} section={section} />
            ))
          ) : (
            <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
              No saved subscale form details available for preview.
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default SubscaleDetailsView;