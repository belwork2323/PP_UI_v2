import React, { useState } from "react";
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

import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { icons } from "../../../../app/theme/icons";
import {
  APPROVER_PRIORITY_META,
  APPROVER_STATUS_META,
  isApproverActionableStatus,
} from "../../../../app/theme/approver";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";
import { fetchSubscaleFormDetailsApi } from "../../../../data/api/users/manufacturing/subscaleFormApi";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  scale: ScaleRoundedIcon,
} = icons.approver.manufacturing.subscale;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  ss: "#1565C0",
  ssLight: "#1976D2",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const PRIORITY_META = APPROVER_PRIORITY_META;
export const SS_STATUS_META = APPROVER_STATUS_META;

const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.ss}, ${BRAND.ssLight})`,
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
  fontSize: "0.78rem",
  color: BRAND.text,
  borderBottom: `1px solid ${alpha(BRAND.border, 0.6)}`,
});

const StatusChip = ({ status }: { status: string }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: SS_STATUS_META[status]?.bg,
      color: SS_STATUS_META[status]?.color,
      border: `1px solid ${SS_STATUS_META[status]?.border}`,
    }}
  />
);

const PriorityChip = ({ priority }: { priority: string }) => {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.Medium;
  return (
    <Chip
      label={priority}
      size="small"
      sx={{
        height: 22,
        fontWeight: 700,
        fontSize: "0.68rem",
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
    />
  );
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
  key.endsWith("_TABLE") ||
  key === "CASTING_TABLE" ||
  key === "CURING_TABLE" ||
  key === "NDT_TABLE" ||
  key === "TRIMMING_TABLE" ||
  key === "INHIBITION_TABLE" ||
  key === "MECHANICAL_PROPERTIES_TABLE" ||
  key === "STATIC_TESTING_TABLE";

const DynamicTable = ({ rows }: { rows: Record<string, any>[] }) => {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  return (
    <TableContainer
      sx={{ mt: 1, mb: 1.5, border: `1px solid ${alpha(BRAND.ss, 0.2)}`, borderRadius: 1.5, overflowX: "auto" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: alpha(BRAND.ss, 0.08) }}>
            {cols.map((col) => (
              <TableCell
                key={col}
                sx={{ fontWeight: 700, fontSize: "0.62rem", color: BRAND.ss, px: 1.5, py: 0.8, whiteSpace: "nowrap" }}
              >
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
  const simpleKeys =
    entries.length > 0 ? Object.keys(entries[0]).filter((k) => !k.startsWith("_") && !isArrayField(k)) : [];
  const tableKeys = entries.length > 0 ? Object.keys(entries[0]).filter((k) => isArrayField(k)) : [];

  if (!entries.length) return null;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box
        sx={{
          px: 1.5,
          py: 1,
          mb: 1,
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
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      color: BRAND.textSub,
                      px: 1.5,
                      py: 0.6,
                      width: 220,
                      borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
                    }}
                  >
                    {fieldLabel(key)}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: BRAND.text,
                      px: 1.5,
                      py: 0.6,
                      borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
                    }}
                  >
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

const SubscaleDetailDialog = ({ open, onClose, item, detailData, detailsLoading, onApprove, onReject }: any) => {
  if (!item) return null;
  const sections = detailData?.sections ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.surface }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: `linear-gradient(135deg,${BRAND.ss},${BRAND.ssLight})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ScaleRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: BRAND.text }}>{item.batchId}</Typography>
                <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                  {item.motorId}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          {detailsLoading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          ) : sections.length > 0 ? (
            sections.map((section: any) => <SectionRenderer key={section.sectionId} section={section} />)
          ) : (
            <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
              No saved subscale form details available for preview.
            </Typography>
          )}

          {isApproverActionableStatus(item.status) ? (
            <Stack direction="row" gap={1.5} justifyContent="flex-end" mt={3}>
              <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={() => onReject(item)}>
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => onApprove(item)}
                sx={{ background: BRAND.ss, "&:hover": { background: BRAND.ssLight } }}
              >
                Approve
              </Button>
            </Stack>
          ) : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const SubscaleApproverPage = () => {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems,
    setSelected,
    subDepartment: "subscale",
  });

  const handleViewDetails = async (row: any) => {
    setSelected(row);
    setDetailData(null);
    setDetailsLoading(true);

    try {
      const response = await fetchSubscaleFormDetailsApi({ formId: row.formId, subDepartmentId: 0 } as any);
      const prep = response?.data?.sections ?? response?.data?.details?.sections;
      if (prep) setDetailData({ sections: prep });
    } catch {
      setDetailData(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="subscale"
      items={items}
      statusField="status"
      statusMeta={SS_STATUS_META}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      filterFields={[
        { field: "priority", label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
        { field: "motorType", label: "Type", options: ["S", "A", "B"] },
      ]}
    >
      {(filtered) => (
        <>
          <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 2.5, overflow: "hidden" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TH>Batch ID</TH>
                    <TH>Motor ID</TH>
                    <TH>Submitted By</TH>
                    <TH>Created On</TH>
                    <TH>Priority</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row: any, idx: number) => (
                    <TableRow
                      key={row.id}
                      sx={{
                        background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5),
                        "&:hover": { background: alpha(BRAND.ssLight, 0.04) },
                        "&:last-child td": { borderBottom: "none" },
                        animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                      }}
                    >
                      <TD>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.ss }}>
                          {row.batchId}
                        </Typography>
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>
                      <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>
                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem" }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TD>
                      <TD>
                        <PriorityChip priority={row.priority} />
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
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.ss : BRAND.border,
                            color: isApproverActionableStatus(row.status) ? BRAND.ss : alpha(BRAND.textSub, 0.4),
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

          <SubscaleDetailDialog
            open={!!selected}
            onClose={() => {
              setSelected(null);
              setDetailData(null);
            }}
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

export default SubscaleApproverPage;
