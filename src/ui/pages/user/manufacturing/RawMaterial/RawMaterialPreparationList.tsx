// src/ui/pages/user/manufacturing/RawMaterial/RawMaterialPreparationList.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  alpha,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import FilterToggleButton from "../../../../components/custom/FilterToggleButton";
import UserBatchList from "../../../../components/custom/UserBatchList";
import ManufacturingBatchListFilterPanel from "../components/ManufacturingBatchListFilterPanel";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";
import { motorStageLabel } from "../../../../../data/models/admin/BatchManagementModel";
import { SUBDEPARTMENT_BATCH_SEARCH_FIELDS } from "../../../../../data/models/user/SubdepartmentBatchModel";
import type { SubdepartmentBatchListAdvancedFilters } from "../../../../../hooks/user/useSubdepartmentBatches";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.manufacturing.rawMaterial.preparationList;

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
const canViewPreparationDetails = (status: string) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

export const OPERATION_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const STATUS_DROPDOWN_VALUES = [
  FILTER_ALL,
  ...Object.values(OPERATION_STATUS).filter((status) => status !== OPERATION_STATUS.INITIATED),
] as const;

const S = STRINGS.MANUFACTURING;

const RawMaterialPrepList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const rmTheme = theme.manufacturing.rawMaterialPrep;

  const {
    batches,
    statusCounts,
    totalRecords,
    page,
    rowsPerPage,
    search,
    statusFilter,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    loading,
    handleFillForm,
    handleEditForm,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
    handleViewPreparationDetails,
    motorStageOptions,
    motorStagesLoading,
  } = hookState;

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftBatchId, setDraftBatchId] = useState("");
  const [draftBatchType, setDraftBatchType] = useState(FILTER_ALL);
  const [draftMotorStage, setDraftMotorStage] = useState(FILTER_ALL);
  const [draftMotorId, setDraftMotorId] = useState("");
  const [draftPriority, setDraftPriority] = useState(FILTER_ALL);
  const [draftStatus, setDraftStatus] = useState(FILTER_ALL);

  const syncDraftsFromApplied = useCallback(() => {
    setDraftBatchId(advancedFilters.batchId);
    setDraftBatchType(advancedFilters.batchTypes.length === 1 ? advancedFilters.batchTypes[0]! : FILTER_ALL);
    setDraftMotorStage(advancedFilters.motorStages.length === 1 ? advancedFilters.motorStages[0]! : FILTER_ALL);
    setDraftMotorId(advancedFilters.motorIds[0] ?? "");
    setDraftPriority(advancedFilters.priorities.length === 1 ? advancedFilters.priorities[0]! : FILTER_ALL);
    setDraftStatus(statusFilter);
  }, [advancedFilters, statusFilter]);

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

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(OPERATION_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...theme.batchList.statusConfig[status] },
        ]),
      ),
    [theme],
  );

  const filterToggleSx = useMemo(() => {
    const pl = theme.palette.primaryLight;
    const sub = theme.palette.textSub;
    return {
      filterBtn: (active: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        cursor: "pointer",
        flexShrink: 0,
        px: 1.2,
        py: 0.55,
        borderRadius: 2,
        border: `1px solid ${active ? pl : alpha(pl, 0.35)}`,
        bgcolor: active ? alpha(pl, 0.1) : "transparent",
        color: active ? pl : sub,
        transition: "all 0.15s",
        userSelect: "none",
        "&:hover": {
          bgcolor: alpha(pl, 0.08),
          borderColor: pl,
          color: pl,
        },
      }),
      filterBtnText: { fontSize: "0.72rem", fontWeight: 700, lineHeight: 1 },
      filterBtnIcon: { fontSize: 14 },
      filterBtnChevron: { fontSize: 14, ml: 0.2 },
      filterBadgePill: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(pl, 0.2),
        color: pl,
        borderRadius: "50%",
        width: 16,
        height: 16,
        fontSize: "0.58rem",
        fontWeight: 800,
      },
    };
  }, [theme.palette.primaryLight, theme.palette.textSub]);

  const filterPanelHeaderSx = useMemo(
    () => ({
      containerSx: { alignItems: "center", pb: 0.5 },
      iconSx: { fontSize: 18, color: theme.palette.primaryLight },
      labelSx: { fontSize: "0.82rem", fontWeight: 700, color: theme.palette.text },
      badgeSx: {
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
      },
      clearChipSx: {
        fontWeight: 700,
        fontSize: "0.75rem",
        height: "28px",
        px: 0.5,
        borderColor: alpha(theme.palette.danger, 0.35),
        color: theme.palette.danger,
        "& .MuiChip-label": { px: 1.5 },
      },
    }),
    [theme.palette],
  );

  const COLUMNS = useMemo(
    () => [
      {
        key: "batchId",
        label: S.BATCH_LIST.COL_BATCH_ID,
        render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
      },
      {
        key: "batchType",
        label: S.BATCH_LIST.COL_BATCH_TYPE,
        align: "center",
        render: (v: string) => <Chip label={v} size="small" sx={theme.batchList.batchTypeChip} />,
      },
      {
        key: "motorId",
        label: S.BATCH_LIST.COL_MOTOR_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
      },
      {
        key: "motorType",
        label: S.BATCH_LIST.COL_MOTOR_STAGE,
        align: "center",
        render: (v: string, row: { motorStage?: string | number; motorType?: string }) => (
          <Chip
            label={motorStageLabel(row.motorStage ?? row.motorType ?? v)}
            size="small"
            sx={theme.batchList.batchTypeChip}
          />
        ),
      },
      {
        key: "assignedTo.fullName",
        label: S.BATCH_LIST.COL_MANAGER,
        render: (v: string) => (
          <IconText
            icon={<PersonRoundedIcon sx={theme.batchList.icon} />}
            text={v ?? S.BATCH_LIST.UNASSIGNED}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "createdOn",
        label: S.BATCH_LIST.COL_CREATED_ON,
        render: (v: string) => (
          <IconText
            icon={<CalendarMonthRoundedIcon sx={theme.batchList.icon} />}
            text={new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "priority",
        label: S.BATCH_LIST.COL_PRIORITY,
        align: "center",
        render: (v: string) => {
          const cfg = theme.batchList.priorityConfig[v] ?? theme.batchList.priorityConfig.Medium;
          return <Chip label={v} size="small" sx={rmTheme.list.priorityChip(cfg)} />;
        },
      },
      {
        key: "rmStatus",
        label: "Operation Status",
        align: "center",
        render: (v: string, row: any) => (
          <UserWorkflowStatusCell
            status={v}
            statusConfig={statusConfig}
            rejectedStatus={OPERATION_STATUS.REJECTED}
            rejectionReason={row.rejectionReason}
            theme={theme}
          />
        ),
      },
    ],
    [statusConfig, theme, rmTheme],
  );

  const handleApplyPanelFilters = () => {
    const motorId = draftMotorId.trim();
    const next: SubdepartmentBatchListAdvancedFilters & { status: string } = {
      batchId: draftBatchId.trim(),
      batchTypes: draftBatchType === FILTER_ALL ? [] : [draftBatchType],
      motorStages: draftMotorStage === FILTER_ALL ? [] : [draftMotorStage],
      motorIds: motorId ? [motorId] : [],
      priorities: draftPriority === FILTER_ALL ? [] : [draftPriority],
      status: draftStatus,
    };
    applyAdvancedFilters(next);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    clearAdvancedFilters();
    setDraftBatchId("");
    setDraftBatchType(FILTER_ALL);
    setDraftMotorStage(FILTER_ALL);
    setDraftMotorId("");
    setDraftPriority(FILTER_ALL);
    setDraftStatus(FILTER_ALL);
  };

  const searchBarEnd = (
    <FilterToggleButton
      label={S.BATCH_LIST.FILTERS_TOGGLE}
      count={activeFilterCount}
      isOpen={filterOpen}
      onClick={() => setFilterOpen((v) => !v)}
      sx={filterToggleSx.filterBtn(filterOpen || activeFilterCount > 0)}
      iconSx={filterToggleSx.filterBtnIcon}
      textSx={filterToggleSx.filterBtnText}
      badgeSx={filterToggleSx.filterBadgePill}
      chevronSx={filterToggleSx.filterBtnChevron}
    />
  );

  const filterExtension = filterOpen ? (
    <ManufacturingBatchListFilterPanel
      theme={theme}
      activeFilterCount={activeFilterCount}
      draftBatchId={draftBatchId}
      draftBatchType={draftBatchType}
      draftMotorStage={draftMotorStage}
      draftMotorId={draftMotorId}
      draftPriority={draftPriority}
      draftStatus={draftStatus}
      statusDropdownValues={STATUS_DROPDOWN_VALUES}
      statusConfig={statusConfig}
      motorStageOptions={motorStageOptions}
      motorStagesLoading={motorStagesLoading}
      filterPanelHeaderSx={filterPanelHeaderSx}
      onDraftBatchIdChange={setDraftBatchId}
      onDraftBatchTypeChange={setDraftBatchType}
      onDraftMotorStageChange={setDraftMotorStage}
      onDraftMotorIdChange={setDraftMotorId}
      onDraftPriorityChange={setDraftPriority}
      onDraftStatusChange={setDraftStatus}
      onApply={handleApplyPanelFilters}
      onClear={handleClearAllFilters}
      onClose={() => setFilterOpen(false)}
    />
  ) : null;

  return (
    <UserBatchList
      rows={batches}
      columns={COLUMNS}
      statusField="rmStatus"
      statusConfig={statusConfig}
      filters={[]}
      searchFields={[...SUBDEPARTMENT_BATCH_SEARCH_FIELDS]}
      highlightRow={(row: any) => row.rmStatus === OPERATION_STATUS.REJECTED}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={S.RAW_MATERIAL_PREP.TABLE_LABEL}
      themeTokens={theme}
      totalRecords={totalRecords}
      statusCounts={statusCounts}
      page={page}
      rowsPerPage={rowsPerPage}
      search={search}
      statusFilter={statusFilter}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      isLoading={loading}
      searchBarEnd={searchBarEnd}
      filterExtension={filterExtension}
      renderAction={(row: any) => (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
          {canViewPreparationDetails(row.rmStatus) ? (
            <Tooltip title={S.RAW_MATERIAL_PREP.VIEW_DETAILS_TOOLTIP} arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleViewPreparationDetails(row)}
                sx={{
                  color: theme.palette.primaryLight,
                  border: `1px solid ${alpha(theme.palette.primaryLight, 0.35)}`,
                  borderRadius: 1.5,
                  "&:hover": {
                    background: alpha(theme.palette.primaryLight, 0.08),
                  },
                }}
              >
                <VisibilityRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <UserWorkflowStatusAction
              status={row.rmStatus}
              row={row}
              statusMap={OPERATION_STATUS}
              onFillForm={handleFillForm}
              onEditForm={handleEditForm}
              theme={theme}
              fillLabel={S.BATCH_LIST.FILL_ACTION}
              continueLabel={S.BATCH_LIST.CONTINUE_ACTION}
              editTooltip={S.BATCH_LIST.EDIT_ACTION_TOOLTIP}
            />
          )}
        </Stack>
      )}
    />
  );
};

export default RawMaterialPrepList;
