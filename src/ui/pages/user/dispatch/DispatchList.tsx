import React, { useMemo } from "react";
import { Chip, Typography } from "@mui/material";
import { icons } from "../../../../app/theme/icons";
import IconText from "../../../components/common/IconText";
import UserBatchList from "../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../app/store/themeStore";
import getOperationsTheme from "../../../../app/theme/custom_themes/shared/operations_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../hooks/operationStatus";
import { STRINGS } from "../../../../app/config/strings";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.dispatch.list;

export const DISPATCH_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const S = STRINGS.DISPATCH;
const B = STRINGS.MANUFACTURING.BATCH_LIST;

const DispatchList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getOperationsTheme(mode), [mode]);
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
  } = hookState;

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(DISPATCH_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...theme.batchList.statusConfig[status] },
        ]),
      ),
    [theme],
  );

  const columns = useMemo(
    () => [
      {
        key: "batchId",
        label: B.COL_BATCH_ID,
        render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
      },
      {
        key: "motorId",
        label: B.COL_MOTOR_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
      },
      {
        key: "motorType",
        label: B.COL_TYPE,
        align: "center",
        render: (v: string) => (
          <Chip label={`${B.MOTOR_TYPE_PREFIX}${v}`} size="small" sx={theme.batchList.batchTypeChip} />
        ),
      },
      {
        key: "assignedTo.fullName",
        label: B.COL_MANAGER,
        render: (v: string) => (
          <IconText
            icon={<PersonRoundedIcon sx={theme.batchList.icon} />}
            text={v ?? B.UNASSIGNED}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "createdOn",
        label: B.COL_CREATED_ON,
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
        label: B.COL_PRIORITY,
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
        key: "dispatchStatus",
        label: S.COL_STATUS,
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
      rows={batches}
      columns={columns}
      statusField="dispatchStatus"
      statusConfig={statusConfig}
      filters={[{ field: "priority", options: ["Critical", "High", "Medium", "Low"] }]}
      searchFields={["batchId", "motorId"]}
      highlightRow={(row: any) => row.dispatchStatus === OPERATION_STATUS.REJECTED}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={S.TABLE_LABEL}
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
      renderAction={(row: any) => (
        <UserWorkflowStatusAction
          status={row.dispatchStatus}
          row={row}
          statusMap={OPERATION_STATUS}
          onFillForm={handleFillForm}
          onEditForm={handleEditForm}
          theme={theme}
          fillLabel={B.FILL_ACTION}
          continueLabel={B.CONTINUE_ACTION}
          editLabel={S.EDIT_ACTION}
          editTooltip={B.EDIT_ACTION_TOOLTIP}
          waitingLabel={S.WAITING_LABEL}
          approvedLabel={S.APPROVED_LABEL}
        />
      )}
    />
  );
};

export default DispatchList;
