// src/ui/pages/user/manufacturing/CastingAndCuring/CastingAndCuringList.tsx

import React, { useMemo } from "react";
import { Chip, IconButton, Stack, Tooltip, Typography, alpha } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import UserBatchList from "../../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { getManufacturingTheme } from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { MANUFACTURING_STATUS } from "../../../../../hooks/user/manufacturing/manufacturingWorkflowData";
import { STRINGS } from "../../../../../app/config/strings";
import { getStageCfg } from "../../../../../hooks/user/manufacturing/castingAndCuringConfig";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
  thermostat: ThermostatRoundedIcon,
} = icons.user.manufacturing.castingAndCuring.list;

export const CC_STATUS = MANUFACTURING_STATUS;

export const CC_STATUS_CONFIG = {
  [CC_STATUS.INITIATED]:            { Icon: HourglassEmptyRoundedIcon,    label: "Initiated" },
  [CC_STATUS.IN_PROGRESS]:          { Icon: PlayCircleOutlineRoundedIcon, label: "In Progress" },
  [CC_STATUS.WAITING_FOR_APPROVAL]: { Icon: PendingActionsRoundedIcon,    label: "Waiting for Approval" },
  [CC_STATUS.APPROVED]:             { Icon: CheckCircleRoundedIcon,       label: "Approved" },
  [CC_STATUS.REJECTED]:             { Icon: CancelRoundedIcon,            label: "Rejected" },
};

const S = STRINGS.MANUFACTURING;

const canViewDetails = (status: string) =>
  Boolean(status) && status !== CC_STATUS.INITIATED;

const CastingCuringList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);

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
    handleViewCastingCuringDetails,
  } = hookState;

  const displayRows = Array.isArray(batches) ? batches : [];
  const displayTotalRecords = totalRecords ?? 0;
  const displayStatusCounts = statusCounts ?? {};

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(CC_STATUS_CONFIG).map(([status, cfg]) => [status, { ...cfg, ...theme.batchList.statusConfig[status] }]),
      ),
    [theme],
  );

  const COLUMNS = useMemo(
    () => [
      {
        key: "batchId",
        label: S.BATCH_LIST.COL_BATCH_ID,
        render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
      },
      {
        key: "motorId",
        label: S.BATCH_LIST.COL_MOTOR_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
      },
      {
        key: "motorStage",
        label: S.BATCH_LIST.COL_TYPE,
        align: "center",
        render: (v: string) => (
          <Chip
            label={`${S.BATCH_LIST.MOTOR_TYPE_PREFIX}${String(v ?? "")}`}
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
            text={new Date(String(v ?? "")).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "priority",
        label: S.BATCH_LIST.COL_PRIORITY,
        align: "center",
        render: (v: string) => {
          const str = String(v ?? "");
          const cfg = theme.batchList.priorityConfig[str] ?? theme.batchList.priorityConfig.Medium;
          return <Chip label={str} size="small" sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }} />;
        },
      },
      {
        key: "ccStatus",
        label: S.CASTING_CURING.COL_CC_STATUS,
        align: "center",
        render: (v: string, row: any) => (
          <UserWorkflowStatusCell
            status={String(v ?? "")}
            statusConfig={statusConfig}
            rejectedStatus={CC_STATUS.REJECTED}
            rejectionReason={row.rejectionReason}
            theme={theme}
          />
        ),
      },
    ],
    [statusConfig, theme],
  );

  return (
    <UserBatchList
      rows={displayRows}
      columns={COLUMNS}
      statusField="ccStatus"
      statusConfig={statusConfig}
      filters={[
        { field: "priority", options: ["Critical", "High", "Medium", "Low"] },
      ]}
      searchFields={["batchId", "motorId"]}
      highlightRow={(row: any) => row.ccStatus === CC_STATUS.REJECTED}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={S.CASTING_CURING.TABLE_LABEL}
      themeTokens={theme}
      totalRecords={displayTotalRecords}
      statusCounts={displayStatusCounts}
      page={page}
      rowsPerPage={rowsPerPage}
      search={search}
      statusFilter={statusFilter}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      isLoading={loading}
      renderAction={(row: any) => (
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {canViewDetails(row.ccStatus) ? (
            <Tooltip title={S.BATCH_LIST.VIEW_DETAILS_TOOLTIP} arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleViewCastingCuringDetails(row)}
                sx={{
                  color: theme.palette.primaryLight,
                  border: `1px solid ${alpha(theme.palette.primaryLight, 0.35)}`,
                  borderRadius: 1.5,
                  "&:hover": { background: alpha(theme.palette.primaryLight, 0.08) },
                }}
              >
                <VisibilityRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <UserWorkflowStatusAction
              status={row.ccStatus}
              row={row}
              statusMap={CC_STATUS}
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

export default CastingCuringList;
