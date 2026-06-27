import React from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Zoom,
} from "@mui/material";

import { icons } from "../../../../../../app/theme";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  stageConfig,
  statusConfig,
  priorityConfig,
  getBatchId,
  getMotorId,
  getMotorStage,
  getStage,
  getStatus,
  getPriority,
  getSubDept,
  getSystemManagerLabel,
  isIdentificationSheetCompleted,
} from "./BatchConfigs";

const S = STRINGS.BATCH_MANAGEMENT;
const D = S.DETAILS;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatBatchType = (batch: any): string => {
  const type = batch.batchType === "SUBSCALE" ? "Subscale Batch" : "Main Batch";
  if (batch.batchType !== "SUBSCALE" || !batch.subBatchType) return type;
  const sub =
    batch.subBatchType === "EXPERIMENTAL"
      ? "Experimental"
      : batch.subBatchType === "QUALIFICATION"
        ? "Qualification"
        : batch.subBatchType;
  return `${type} · ${sub}`;
};

const displayValue = (value: unknown) => {
  if (value == null) return "—";
  const text = String(value).trim();
  return text || "—";
};

const displayNumber = (value: number | undefined | null) => {
  if (value == null || value === 0) return "—";
  return String(value);
};

const materialManufacturer = (material: any): string =>
  String(material.manufacturerName ?? material.make ?? "").trim() || "—";

type BatchDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  batch: any;
  loading?: boolean;
  t: any;
};

export default function BatchDetailsDialog({
  open,
  onClose,
  batch,
  loading = false,
  t,
}: BatchDetailsDialogProps) {
  const { detailsDialog, tableCell } = t;
  const sheet = batch?.identificationSheet;
  const materials = Array.isArray(sheet?.materials) ? sheet.materials : [];
  const hasImplementation = batch ? isIdentificationSheetCompleted(batch) : false;

  const department = batch ? getStage(batch) : "—";
  const subDepartment = batch ? getSubDept(batch) : "—";
  const status = batch ? getStatus(batch) : "—";
  const priority = batch ? getPriority(batch) : "Medium";
  const scStage = stageConfig[department];
  const scStatus = statusConfig[status];
  const pc = priorityConfig[priority];

  const batchMetaFields = batch
    ? [
        { label: S.FORM.BATCH_ID_LABEL, value: getBatchId(batch) },
        { label: D.BATCH_TYPE, value: formatBatchType(batch) },
        {
          label: D.PROJECT,
          value: batch.projectName
            ? `${batch.projectName}${batch.projectId ? ` (${batch.projectId})` : ""}`
            : displayValue(batch.projectId),
        },
        { label: D.MOTOR_STAGE, value: getMotorStage(batch) },
        { label: D.MOTOR_COUNT, value: displayValue(batch.numberOfMotors) },
        { label: D.MOTOR_IDS, value: getMotorId(batch) },
        { label: D.DEPARTMENT, value: department },
        { label: D.SUB_DEPARTMENT, value: subDepartment },
        { label: D.STATUS, value: status },
        { label: S.FORM.PRIORITY_LABEL, value: priority },
        { label: S.FORM.ASSIGNED_TO_LABEL, value: getSystemManagerLabel(batch) },
        {
          label: D.IMPLEMENTATION_STATUS,
          value: hasImplementation ? "Completed" : "Draft",
        },
        {
          label: "Created By",
          value: batch.createdBy?.name ?? S.FORM.UNASSIGNED,
        },
        { label: "Created On", value: formatDateTime(batch.createdOn) },
        { label: D.UPDATED_BY, value: batch.updatedBy?.name ?? "—" },
        { label: D.UPDATED_ON, value: formatDateTime(batch.updatedOn) },
      ]
    : [];

  const implementationFields = sheet
    ? [
        { label: "Date", value: formatDate(sheet.date) },
        { label: "Batch Size", value: displayNumber(sheet.batchSize) },
        { label: "Bonding Sheet No", value: displayValue(sheet.bondingSheetNo) },
        { label: "Mixer Type", value: displayValue(sheet.mixerType ?? sheet.mixerDetails) },
        { label: "Building No", value: displayValue(sheet.BldgNo) },
        { label: "Number of Premix", value: displayValue(sheet.numberOfPremix) },
        { label: "Remarks", value: displayValue(sheet.remarks) },
      ]
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Zoom}
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: detailsDialog.paper }}
    >
      <Box sx={detailsDialog.header.wrapper}>
        <Box>
          <Box sx={detailsDialog.header.titleRow}>
            <Box sx={detailsDialog.header.iconBadge}>
              <icons.batchMgmt.batchIcon sx={detailsDialog.header.icon} />
            </Box>
            <Box>
              <Typography sx={detailsDialog.header.title}>{D.TITLE}</Typography>
              <Typography sx={detailsDialog.header.subtitle}>
                {batch ? getBatchId(batch) : "—"}
                {batch ? ` · ${getMotorStage(batch)} · ${getMotorId(batch)}` : ""}
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={detailsDialog.header.closeButton}>
          <icons.batchMgmt.close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={detailsDialog.content}>
        {loading ? (
          <Box sx={detailsDialog.loadingBox}>
            <CircularProgress size={36} />
            <Typography sx={detailsDialog.loadingText}>{D.LOADING}</Typography>
          </Box>
        ) : !batch ? (
          <Typography sx={detailsDialog.emptyText}>{D.NO_IMPLEMENTATION}</Typography>
        ) : (
          <>
            <Box sx={detailsDialog.section}>
              <Typography sx={detailsDialog.sectionTitle}>
                <icons.batchMgmt.batchIcon sx={{ fontSize: 16 }} />
                {D.BATCH_INFO_SECTION}
              </Typography>

              {batch && (
                <Box sx={detailsDialog.workflowStrip}>
                  <Typography sx={detailsDialog.workflowLabel}>{D.WORKFLOW_SECTION}</Typography>
                  <Chip
                    icon={scStage ? <scStage.Icon /> : undefined}
                    label={department}
                    size="small"
                    sx={tableCell.stageChip(scStage)}
                  />
                  <Chip
                    label={subDepartment}
                    size="small"
                    variant="outlined"
                    sx={tableCell.stageChip(scStage)}
                  />
                  <Chip
                    icon={scStatus ? <scStatus.Icon /> : undefined}
                    label={status}
                    size="small"
                    sx={tableCell.statusChip(scStatus)}
                  />
                  <Chip label={priority} size="small" sx={tableCell.priorityChip(pc)} />
                </Box>
              )}

              <Box sx={detailsDialog.metaGrid}>
                {batchMetaFields.map((field) => (
                  <Box key={field.label} sx={detailsDialog.metaItem}>
                    <Typography sx={detailsDialog.metaLabel}>{field.label}</Typography>
                    <Typography sx={detailsDialog.metaValue}>{field.value}</Typography>
                  </Box>
                ))}
              </Box>

              {batch.objective?.trim() && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={detailsDialog.metaLabel}>{D.OBJECTIVE}</Typography>
                  <Typography sx={{ ...detailsDialog.metaValue, mt: 0.5 }}>{batch.objective}</Typography>
                </Box>
              )}

              {Array.isArray(batch.articles) && batch.articles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ ...detailsDialog.metaLabel, mb: 0.75 }}>{D.ARTICLES}</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {batch.articles.map((article: string) => (
                      <Chip key={article} label={article} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            <Box sx={detailsDialog.section}>
              <Typography sx={detailsDialog.sectionTitle}>
                <icons.batchMgmt.batchId sx={{ fontSize: 16 }} />
                {D.IMPLEMENTATION_SECTION}
              </Typography>

              {!hasImplementation ? (
                <Typography sx={detailsDialog.emptyText}>{D.NO_IMPLEMENTATION}</Typography>
              ) : (
                <>
                  <Box sx={detailsDialog.metaGrid}>
                    {implementationFields.map((field) => (
                      <Box key={field.label} sx={detailsDialog.metaItem}>
                        <Typography sx={detailsDialog.metaLabel}>{field.label}</Typography>
                        <Typography sx={detailsDialog.metaValue}>{field.value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2.5 }}>
                    <Typography sx={{ ...detailsDialog.sectionTitle, mb: 1 }}>
                      {D.MATERIALS_SECTION}
                    </Typography>

                    {materials.length === 0 ? (
                      <Typography sx={detailsDialog.emptyText}>{D.NO_MATERIALS}</Typography>
                    ) : (
                      <TableContainer sx={detailsDialog.materialsTable.container}>
                        <Table size="small" sx={detailsDialog.materialsTable.table}>
                          <TableHead>
                            <TableRow>
                              {[
                                "Sr. No",
                                "Material Code",
                                "Material Name",
                                "Lot ID",
                                "Manufacturer",
                                "Required Composition %",
                                "Qty/Premix",
                                "Revalidation From",
                                "Revalidation To",
                              ].map((header) => (
                                <TableCell key={header} sx={detailsDialog.materialsTable.headCell}>
                                  {header}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {materials.map((material: any, idx: number) => (
                              <TableRow key={`${material.materialCode}-${idx}`} sx={detailsDialog.materialsTable.bodyRow(idx)}>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{material.srNo ?? idx + 1}</TableCell>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{displayValue(material.materialCode)}</TableCell>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{displayValue(material.materialName)}</TableCell>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{displayValue(material.lotId)}</TableCell>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{materialManufacturer(material)}</TableCell>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{displayNumber(material.requiredComposition)}</TableCell>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{displayNumber(material.quantityPerPremix)}</TableCell>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{formatDate(material.revalidationFromDate)}</TableCell>
                                <TableCell sx={detailsDialog.materialsTable.bodyCell}>{formatDate(material.revalidationToDate)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </>
        )}
      </Box>

      <Box sx={detailsDialog.footer}>
        <Button onClick={onClose} sx={detailsDialog.closeButton}>
          {D.CLOSE}
        </Button>
      </Box>
    </Dialog>
  );
}
