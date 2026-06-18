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
import { APPROVER_PRIORITY_META, APPROVER_STATUS_META, isApproverActionableStatus } from "../../../../app/theme/approver";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";
import { fetchTrimmingFormDetailsApi } from "../../../../data/api/users/manufacturing/trimmingFormApi";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  straighten: StraightenRoundedIcon,
} = icons.approver.manufacturing.trimming;

const BRAND = {
  primary: "#6A1B9A",
  primaryLight: "#8E24AA",
  accent: "#4527A0",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  tr: "#6A1B9A",
  trLight: "#8E24AA",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const PRIORITY_META = APPROVER_PRIORITY_META;
export const TR_STATUS_META = APPROVER_STATUS_META;

const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.tr}, ${BRAND.trLight})`,
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

const StatusChip = ({ status }: { status: string }) => {
  const meta = TR_STATUS_META[status] ?? TR_STATUS_META.Pending;
  const Icon = meta.Icon;
  return (
    <Chip
      icon={<Icon sx={{ fontSize: "13px !important", color: `${meta.color} !important` }} />}
      label={status}
      size="small"
      sx={{
        height: 24,
        fontWeight: 700,
        fontSize: "0.68rem",
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
    />
  );
};

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

const MOCK_TR_SUBMISSIONS = [
  {
    id: 1,
    batchId: "TR-2026-042",
    motorId: "MTR-TR-001",
    motorStage: "S0",
    status: "Pending",
    priority: "High",
    submittedBy: "operator.trimming",
    createdOn: "2026-03-14T11:30:00",
    formId: "tr-form-001",
  },
];

const TrimmingDetailDialog = ({
  open,
  onClose,
  item,
  detailData,
  detailsLoading,
  onApprove,
  onReject,
}: any) => {
  if (!item) return null;

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
                  background: `linear-gradient(135deg,${BRAND.tr},${BRAND.trLight})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StraightenRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: BRAND.text }}>
                  {item.batchId}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                  {item.motorStage} · {item.motorId}
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
          ) : (
            <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
              {detailData
                ? "Trimming form details loaded."
                : "No saved trimming form details available for preview."}
            </Typography>
          )}

          {isApproverActionableStatus(item.status) ? (
            <Stack direction="row" gap={1.5} justifyContent="flex-end" mt={3}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelRoundedIcon />}
                onClick={onReject}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={onApprove}
                sx={{ background: BRAND.tr, "&:hover": { background: BRAND.trLight } }}
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

const TrimmingApproverPage = () => {
  const [items] = useState(MOCK_TR_SUBMISSIONS);
  const [selected, setSelected] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems: () => {},
    setSelected,
    subDepartment: "trimming",
  });

  const handleViewDetails = async (row: any) => {
    setSelected(row);
    setDetailData(null);
    setDetailsLoading(true);

    try {
      const response = await fetchTrimmingFormDetailsApi({ formId: row.formId, subDepartmentId: 0 });
      if (response?.data) setDetailData(response.data);
    } catch {
      setDetailData(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="trimming"
      items={items}
      statusField="status"
      statusMeta={TR_STATUS_META}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      filterFields={[
        { field: "priority", label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
        { field: "motorStage", label: "Stage", options: ["S0", "S1", "S2", "S3"] },
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
                    <TH>Motor Stage</TH>
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
                        "&:hover": { background: alpha(BRAND.trLight, 0.04) },
                        "&:last-child td": { borderBottom: "none" },
                        animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                      }}
                    >
                      <TD>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.tr }}>
                          {row.batchId}
                        </Typography>
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorStage}</TD>
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
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.tr : BRAND.border,
                            color: isApproverActionableStatus(row.status) ? BRAND.tr : alpha(BRAND.textSub, 0.4),
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

          <TrimmingDetailDialog
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

export default TrimmingApproverPage;
