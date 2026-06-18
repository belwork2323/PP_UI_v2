import React, { useMemo } from "react";
import { Chip, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import UserBatchList from "../../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { resolveTrimmingMotorStage } from "../../../../../schema-engine";
import { STRINGS } from "../../../../../app/config/strings";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
  straighten: StraightenRoundedIcon,
} = icons.user.manufacturing.trimming.list;

export const TR_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const S = STRINGS.MANUFACTURING;

const USE_MOCK_TR_BATCH = import.meta.env.DEV;

const MOCK_TR_BATCHES = [
  {
    id: "mock-tr-s0",
    batchId: "BATCH-2026-TR-S0-001",
    projectId: "PRJ-2026-0001",
    projectName: "PRJ-2026-0001",
    motorId: "MTR-301",
    motorIds: ["MTR-301", "MTR-302", "MTR-303"],
    motorType: "0",
    motorStage: 0,
    numberOfMotors: 3,
    assignedTo: { fullName: "EMP009" },
    systemManagerId: "EMP009",
    createdOn: "2026-04-17T10:00:00Z",
    priority: "High",
    trStatus: OPERATION_STATUS.INITIATED,
    formId: null,
  },
  {
    id: "mock-tr-s0-b",
    batchId: "BATCH-2026-TR-S0-002",
    projectId: "PRJ-2026-0001",
    projectName: "PRJ-2026-0001",
    motorId: "MTR-501",
    motorIds: ["MTR-501", "MTR-502", "MTR-503"],
    motorType: "0",
    motorStage: 0,
    numberOfMotors: 3,
    assignedTo: { fullName: "EMP011" },
    systemManagerId: "EMP011",
    createdOn: "2026-04-19T10:00:00Z",
    priority: "Medium",
    trStatus: OPERATION_STATUS.INITIATED,
    formId: null,
  },
  {
    id: "mock-tr-s1",
    batchId: "BATCH-2026-TR-S1-001",
    projectId: "PRJ-2026-0002",
    projectName: "PRJ-2026-0002",
    motorId: "MTR-401",
    motorIds: ["MTR-401", "MTR-402"],
    motorType: "1",
    motorStage: 1,
    numberOfMotors: 2,
    assignedTo: { fullName: "EMP009" },
    systemManagerId: "EMP009",
    createdOn: "2026-04-18T10:00:00Z",
    priority: "Medium",
    trStatus: OPERATION_STATUS.INITIATED,
    formId: null,
  },
];

const TrimmingList = ({ hookState, rowsPerPageOptions }: any) => {
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
  } = hookState;

  const displayRows = useMemo(
    () => (USE_MOCK_TR_BATCH ? [...MOCK_TR_BATCHES, ...batches] : batches),
    [batches],
  );

  const displayTotalRecords = USE_MOCK_TR_BATCH
    ? totalRecords + MOCK_TR_BATCHES.length
    : totalRecords;

  const displayStatusCounts = useMemo(() => {
    if (!USE_MOCK_TR_BATCH) return statusCounts;
    const next = { ...statusCounts };
    MOCK_TR_BATCHES.forEach((row) => {
      const status = row.trStatus;
      next[status] = (next[status] ?? 0) + 1;
      next[STRINGS.USER_BATCH_LIST.FILTER_ALL] =
        next[STRINGS.USER_BATCH_LIST.FILTER_ALL] ?? displayTotalRecords;
    });
    return next;
  }, [statusCounts, displayTotalRecords]);

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(TR_STATUS_CONFIG).map(([status, cfg]) => [
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
        render: (_v: string, row: any) => (
          <Chip
            icon={<StraightenRoundedIcon sx={{ fontSize: "12px !important" }} />}
            label={resolveTrimmingMotorStage(row)}
            size="small"
            sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700, maxWidth: 120 }}
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
        key: "trStatus",
        label: S.TRIMMING.COL_TR_STATUS,
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
      statusField="trStatus"
      statusConfig={statusConfig}
      filters={[{ field: "priority", options: ["Critical", "High", "Medium", "Low"] }]}
      searchFields={["batchId", "motorId"]}
      highlightRow={(row: any) => row.trStatus === OPERATION_STATUS.REJECTED}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={S.TRIMMING.TABLE_LABEL}
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
      emptyText={S.TRIMMING.EMPTY_TEXT}
      renderAction={(row: any) => (
        <UserWorkflowStatusAction
          status={row.trStatus}
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
    />
  );
};

export default TrimmingList;
