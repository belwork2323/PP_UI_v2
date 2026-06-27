import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  alpha,
  Card,
  Button,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { styled, keyframes } from "@mui/material/styles";

import { useThemeStore } from "../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import FilterPanelHeader from "../../../components/custom/FilterPanelHeader";
import FilterToggleButton from "../../../components/custom/FilterToggleButton";
import { icons } from "../../../../app/theme/icons";
import { APPROVER_STATUS_META, isApproverActionableStatus } from "../../../../app/theme/approver";
import useRawMaterialPreparationApproverHook, {
  type RawMaterialPrepApproverAppliedFilters,
} from "../../../../hooks/approver/manufacturing/useRawMaterialPreparationApproverHook";
import { motorStageLabel } from "../../../../data/models/admin/BatchManagementModel";
import { MANUFACTURING_BATCH_TYPE_OPTIONS } from "../../../../data/models/user/SubdepartmentBatchModel";
import { STRINGS } from "../../../../app/config/strings";
import getApproverManufacturingFilterStyles from "./approverManufacturingFilterStyles";
import RawMaterialPreparationApproverDetailDialog from "./RawMaterialPreparationApproverDetailDialog";

const BL = STRINGS.MANUFACTURING.BATCH_LIST;

const { visibility: VisibilityRoundedIcon } = icons.approver.manufacturing.rawMaterialPreparation;

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
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status meta ───────────────────────────────────────────────────────────────
export const RMP_STATUS_META = APPROVER_STATUS_META;

// ─── Styled cells ─────────────────────────────────────────────────────────────
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
  "&:first-of-type": { borderRadius: "6px 0 0 0" },
  "&:last-of-type": { borderRadius: "0 6px 0 0" },
});

const TD = styled(TableCell)({
  padding: "10px 14px",
  fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

// ─── Chip helpers ─────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: RMP_STATUS_META[status]?.bg,
      color: RMP_STATUS_META[status]?.color,
      border: `1px solid ${RMP_STATUS_META[status]?.border}`,
    }}
  />
);
const TypeChip = ({ type }) => (
  <Chip
    label={motorStageLabel(type)}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: alpha(BRAND.primaryLight, 0.1),
      color: BRAND.primaryLight,
      border: `1px solid ${alpha(BRAND.primaryLight, 0.2)}`,
    }}
  />
);
const BatchTypeChip = ({ type }) => (
  <Chip
    label={type}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: alpha(BRAND.primaryLight, 0.1),
      color: BRAND.primaryLight,
      border: `1px solid ${alpha(BRAND.primaryLight, 0.2)}`,
    }}
  />
);


// ─── Main export ──────────────────────────────────────────────────────────────
const RawMaterialPreparationApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const approverTheme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);
  const filterStyles = useMemo(() => getApproverManufacturingFilterStyles(mode), [mode]);

  const {
    items,
    selected,
    detailsLoading,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
    appliedFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel,
    motorStageOptions,
    motorStagesLoading,
    applyClientFilters,
  } = useRawMaterialPreparationApproverHook();

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftBatchId, setDraftBatchId] = useState("");
  const [draftBatchType, setDraftBatchType] = useState(filterAllLabel);
  const [draftMotorId, setDraftMotorId] = useState("");
  const [draftMotorStage, setDraftMotorStage] = useState(filterAllLabel);
  const [draftSubmittedBy, setDraftSubmittedBy] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStatus, setDraftStatus] = useState(filterAllLabel);

  const syncDraftsFromApplied = useCallback(() => {
    setDraftBatchId(appliedFilters.batchId);
    setDraftBatchType(appliedFilters.batchType || filterAllLabel);
    setDraftMotorId(appliedFilters.motorId);
    setDraftMotorStage(appliedFilters.motorStage || filterAllLabel);
    setDraftSubmittedBy(appliedFilters.submittedBy);
    setDraftFrom(appliedFilters.fromDate);
    setDraftTo(appliedFilters.toDate);
    setDraftStatus(statusFilter);
  }, [appliedFilters, filterAllLabel, statusFilter]);

  const filterWasOpen = useRef(false);
  useEffect(() => {
    if (filterOpen && !filterWasOpen.current) {
      syncDraftsFromApplied();
    }
    filterWasOpen.current = filterOpen;
  }, [filterOpen, syncDraftsFromApplied]);

  useEffect(() => {
    if (!filterOpen) return;
    setDraftStatus(statusFilter);
  }, [statusFilter, filterOpen]);

  const filterToggleSx = useMemo(
    () => ({
      filterBtn: (active: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        cursor: "pointer",
        flexShrink: 0,
        px: 1.2,
        py: 0.55,
        borderRadius: 2,
        border: `1px solid ${active ? theme.palette.primaryLight : alpha(theme.palette.primaryLight, 0.35)}`,
        bgcolor: active ? alpha(theme.palette.primaryLight, 0.1) : "transparent",
        color: active ? theme.palette.primaryLight : theme.palette.textSub,
        transition: "all 0.15s",
        userSelect: "none",
        "&:hover": {
          bgcolor: alpha(theme.palette.primaryLight, 0.08),
          borderColor: theme.palette.primaryLight,
          color: theme.palette.primaryLight,
        },
      }),
      filterBtnText: { fontSize: "0.72rem", fontWeight: 700, lineHeight: 1 },
      filterBtnIcon: { fontSize: 14 },
      filterBtnChevron: { fontSize: 14, ml: 0.2 },
      filterBadgePill: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(theme.palette.primaryLight, 0.2),
        color: theme.palette.primaryLight,
        borderRadius: "50%",
        width: 16,
        height: 16,
        fontSize: "0.58rem",
        fontWeight: 800,
      },
    }),
    [theme.palette],
  );

  const handleApplyPanelFilters = () => {
    let from = draftFrom;
    let to = draftTo;
    if (from && to && from > to) {
      const swap = from;
      from = to;
      to = swap;
    }

    const next: RawMaterialPrepApproverAppliedFilters & { status: string } = {
      batchId: draftBatchId.trim(),
      batchType: draftBatchType === filterAllLabel ? "" : draftBatchType,
      motorId: draftMotorId.trim(),
      motorStage: draftMotorStage === filterAllLabel ? "" : draftMotorStage,
      submittedBy: draftSubmittedBy.trim(),
      fromDate: from,
      toDate: to,
      status: draftStatus,
    };
    applyPanelFilters(next);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    clearListFilters();
    setDraftBatchId("");
    setDraftBatchType(filterAllLabel);
    setDraftMotorId("");
    setDraftMotorStage(filterAllLabel);
    setDraftSubmittedBy("");
    setDraftFrom("");
    setDraftTo("");
    setDraftStatus(filterAllLabel);
  };

  const searchBarEnd = (
    <FilterToggleButton
      label={BL.FILTERS_TOGGLE}
      count={activeFilterCount}
      isOpen={filterOpen}
      onClick={() => setFilterOpen((open) => !open)}
      sx={filterToggleSx.filterBtn(filterOpen || activeFilterCount > 0)}
      iconSx={filterToggleSx.filterBtnIcon}
      textSx={filterToggleSx.filterBtnText}
      badgeSx={filterToggleSx.filterBadgePill}
      chevronSx={filterToggleSx.filterBtnChevron}
    />
  );

  const filterExtension = filterOpen ? (
    <Stack
      spacing={1.5}
      sx={{
        mt: 1.5,
        pt: 2,
        borderTop: `1px solid ${alpha(theme.palette.border, 0.55)}`,
      }}
    >
      <FilterPanelHeader
        title={BL.FILTERS_TITLE}
        count={activeFilterCount}
        onClear={handleClearAllFilters}
        clearLabel={BL.FILTERS_CLEAR}
        containerSx={{ alignItems: "center", pb: 0.5 }}
        iconSx={{ fontSize: 18, color: theme.palette.primaryLight }}
        labelSx={{ fontSize: "0.82rem", fontWeight: 700, color: theme.palette.text }}
        badgeSx={{
          minWidth: 20,
          height: 20,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.65rem",
          fontWeight: 800,
          bgcolor: alpha(theme.palette.primaryLight, 0.15),
          color: theme.palette.primaryLight,
        }}
        clearChipSx={{
          fontWeight: 700,
          fontSize: "0.75rem",
          height: "28px",
          px: 0.5,
          borderColor: alpha(theme.palette.danger, 0.35),
          color: theme.palette.danger,
          "& .MuiChip-label": { px: 1.5 },
        }}
      />

      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          label={BL.COL_BATCH_ID}
          value={draftBatchId}
          onChange={(event) => setDraftBatchId(event.target.value)}
          placeholder="e.g. BATCH-2026-001"
          sx={{ ...filterStyles.field, minWidth: { xs: "100%", sm: 160 }, flex: { lg: 1 } }}
        />

        <TextField
          select
          size="small"
          label={BL.COL_BATCH_TYPE}
          value={draftBatchType}
          onChange={(event) => setDraftBatchType(event.target.value)}
          sx={filterStyles.fieldWide}
          SelectProps={filterStyles.selectProps}
        >
          <MenuItem value={filterAllLabel}>{BL.FILTERS_ALL_BATCH_TYPES}</MenuItem>
          {MANUFACTURING_BATCH_TYPE_OPTIONS.map((type) => (
            <MenuItem key={type} value={type}>
              {type === "MAIN" ? "Main scale" : "Sub scale"}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label={BL.COL_MOTOR_ID}
          value={draftMotorId}
          onChange={(event) => setDraftMotorId(event.target.value)}
          placeholder="e.g. MTR-445"
          sx={{ ...filterStyles.field, minWidth: { xs: "100%", sm: 160 } }}
        />

        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          sx={{ minWidth: { xs: "100%", sm: 160 }, flex: { lg: "0 0 auto" } }}
        >
          <TextField
            select
            size="small"
            label={BL.COL_MOTOR_STAGE}
            value={draftMotorStage}
            onChange={(event) => setDraftMotorStage(event.target.value)}
            disabled={motorStagesLoading}
            fullWidth
            sx={filterStyles.field}
            SelectProps={filterStyles.selectProps}
          >
            <MenuItem value={filterAllLabel}>{BL.FILTERS_ALL_STAGES}</MenuItem>
            {!motorStagesLoading &&
              motorStageOptions.map((stage) => (
                <MenuItem key={stage.motorStage} value={stage.motorStage}>
                  Stage {stage.motorStage}
                </MenuItem>
              ))}
          </TextField>
          {motorStagesLoading ? (
            <CircularProgress size={18} sx={{ mt: 0.75, color: theme.palette.primaryLight }} />
          ) : null}
        </Stack>

        <TextField
          size="small"
          label={BL.COL_SUBMITTED_BY}
          value={draftSubmittedBy}
          onChange={(event) => setDraftSubmittedBy(event.target.value)}
          placeholder="e.g. Rajesh Kumar"
          sx={{ ...filterStyles.field, minWidth: { xs: "100%", sm: 180 } }}
        />

        <TextField
          select
          size="small"
          label={BL.FILTERS_STATUS}
          value={draftStatus}
          onChange={(event) => setDraftStatus(event.target.value)}
          sx={filterStyles.fieldWide}
          SelectProps={filterStyles.selectProps}
        >
          {statusDropdownValues.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={BL.FILTERS_FROM_DATE}
            format="YYYY-MM-DD"
            value={draftFrom ? dayjs(draftFrom) : null}
            onChange={(value) => setDraftFrom(value && value.isValid() ? value.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: filterStyles.fieldDate,
              },
            }}
          />
          <DatePicker
            label={BL.FILTERS_TO_DATE}
            format="YYYY-MM-DD"
            value={draftTo ? dayjs(draftTo) : null}
            onChange={(value) => setDraftTo(value && value.isValid() ? value.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: filterStyles.fieldDate,
              },
            }}
          />
        </LocalizationProvider>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFilterOpen(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {BL.FILTERS_CLOSE_PANEL}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleApplyPanelFilters}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            bgcolor: theme.palette.primary,
            "&:hover": { bgcolor: theme.palette.primaryLight },
          }}
        >
          {BL.FILTERS_APPLY}
        </Button>
      </Stack>
    </Stack>
  ) : null;

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="raw-material-prep"
      items={items}
      statusField="status"
      statusMeta={RMP_STATUS_META}
      statusTabsOverride={statusTabs}
      activeStatusOverride={statusFilter}
      onActiveStatusChange={setStatusFilter}
      searchBarEnd={searchBarEnd}
      filterExtension={filterExtension}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      searchPlaceholder={STRINGS.APPROVER.LIST.SEARCH_PLACEHOLDER([
        "batch ID",
        "motor ID",
        "submitted by",
      ])}
    >
      {(filtered) => {
        const rows = applyClientFilters(filtered, appliedFilters);

        return (
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
                    <TH>Batch Type</TH>
                    <TH>Motor ID</TH>
                    <TH>{BL.COL_MOTOR_STAGE}</TH>
                    <TH>{BL.COL_SUBMITTED_BY}</TH>
                    <TH>{BL.COL_CREATED_ON}</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
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
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.primary }}>
                          {String(row.batchId ?? "—")}
                        </Typography>
                      </TD>
                      <TD>
                        <BatchTypeChip type={row.batchType} />
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{String(row.motorId ?? "—")}</TD>
                      <TD>
                        <TypeChip type={row.motorStage ?? row.motorType} />
                      </TD>
                      {/* <TD>
                        <PrepTypeBadges types={row.types} solidProcesses={row.solidProcesses} />
                      </TD> */}
                      <TD sx={{ fontSize: "0.78rem" }}>{String(row.submittedBy ?? "—")}</TD>
                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem", whiteSpace: "nowrap" }}>
                        {row.createdOn
                          ? new Date(String(row.createdOn)).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
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
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            textTransform: "none",
                            px: 1.5,
                            py: 0.6,
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.primaryLight : BRAND.border,
                            color: isApproverActionableStatus(row.status) ? BRAND.primaryLight : alpha(BRAND.textSub, 0.4),
                            "&:hover": { background: alpha(BRAND.primaryLight, 0.06) },
                            "&:disabled": { borderColor: BRAND.border },
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

          <RawMaterialPreparationApproverDetailDialog
            open={!!selected}
            onClose={handleCloseDetail}
            item={selected}
            loading={detailsLoading}
            onApprove={requestApprove}
            onReject={requestReject}
            theme={approverTheme}
          />

          <ApproverActionDialog {...dialogProps} />
        </>
        );
      }}
    </ApproverList>
  );
};

export default RawMaterialPreparationApproverPage;
