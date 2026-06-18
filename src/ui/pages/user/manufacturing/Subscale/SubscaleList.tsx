import React, { useMemo } from "react";
import { alpha, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import UserBatchList from "../../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.manufacturing.subscale.list;

const canViewSsDetails = (status: string) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

export const SS_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const S = STRINGS.MANUFACTURING;

const SubscaleList = ({ hookState, rowsPerPageOptions }: any) => {
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
    handleViewDetails,
  } = hookState;

  const displayRows = Array.isArray(batches) ? batches : [];
  const displayTotalRecords = totalRecords ?? 0;
  const displayStatusCounts = statusCounts ?? {};

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(SS_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...theme.batchList.statusConfig[status] },
        ]),
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
        key: "motorType",
        label: S.BATCH_LIST.COL_TYPE,
        align: "center",
        render: (v: string) => (
          <Chip label={`${S.BATCH_LIST.MOTOR_TYPE_PREFIX}${v}`} size="small" sx={theme.batchList.batchTypeChip} />
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
            text={new Date(v).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
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
          return (
            <Chip
              label={v}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.68rem",
                fontWeight: 700,
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
              }}
            />
          );
        },
      },
      {
        key: "ssStatus",
        label: S.SUBSCALE.COL_SS_STATUS,
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
    [statusConfig, theme],
  );

  return (
    <UserBatchList
      rows={displayRows}
      columns={COLUMNS}
      statusField="ssStatus"
      statusConfig={statusConfig}
      filters={[{ field: "priority", options: ["Critical", "High", "Medium", "Low"] }]}
      searchFields={["batchId", "motorId", "articleId"]}
      highlightRow={(row: any) => row.ssStatus === OPERATION_STATUS.REJECTED}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={S.SUBSCALE.TABLE_LABEL}
      themeTokens={theme}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      totalRecords={displayTotalRecords}
      statusCounts={displayStatusCounts}
      search={search}
      statusFilter={statusFilter}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      emptyText={S.SUBSCALE.EMPTY_TEXT}
      renderAction={(row: any) => (
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {canViewSsDetails(row.ssStatus) ? (
            <Tooltip title={S.BATCH_LIST.VIEW_DETAILS_TOOLTIP} arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleViewDetails(row)}
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
              status={row.ssStatus}
              row={row}
              statusMap={OPERATION_STATUS}
              onFillForm={handleFillForm}
              onEditForm={handleEditForm}
              fillLabel={S.BATCH_LIST.FILL_ACTION}
              continueLabel={S.BATCH_LIST.CONTINUE_ACTION}
              editTooltip={S.BATCH_LIST.EDIT_ACTION_TOOLTIP}
              theme={theme}
            />
          )}
        </Stack>
      )}
    />
  );
};

export default SubscaleList;
