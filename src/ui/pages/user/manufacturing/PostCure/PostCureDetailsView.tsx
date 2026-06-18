import React, { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getPostCureTheme from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
type Props = {
  row: any;
  data: any;
  loading?: boolean;
  onBack: () => void;
};

const formatLabel = (value?: string) =>
  String(value ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const PostCureDetailsView = ({
  row,
  data,
  onBack,
}: Props) => {
  const mode = useThemeStore((s) => s.mode);

  const manufacturingTheme = useMemo(
     () => getManufacturingTheme(mode),
     [mode]
   );
 
   const theme = useMemo(
     () => getPostCureTheme(manufacturingTheme),
     [manufacturingTheme]
   );

  const details = data ?? {};

  const statusConfig =
    theme.details.bannerStatusConfig[
      details.status ?? "Initiated"
    ] ??
    theme.details.bannerStatusConfig["Initiated"];

    
  const renderTable = (rows: any[]) => {
  if (!rows?.length) return null;

  const columns = Object.keys(rows[0] ?? {});

  return (
    <TableContainer sx={theme.details.tableContainer}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell
                key={column}
                sx={theme.details.tableHeaderCell(index === 0)}
              >
                {formatLabel(column)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((tableRow, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={theme.details.tableRow(rowIndex)}
            >
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={theme.details.tableCell}
                >
                  {String(tableRow?.[column] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

  const renderField = (key: string, value: any) => {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object"
  ) {
    return (
      <Box key={key} mt={2}>
        <Typography sx={theme.details.sectionTitle}>
          {formatLabel(key)}
        </Typography>

        {renderTable(value)}
      </Box>
    );
  }

  return (
    <Box
      key={key}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1,
        borderBottom: `1px dashed ${theme.brand.border}`,
      }}
    >
      <Typography sx={theme.details.metaLabel}>
        {formatLabel(key)}
      </Typography>

      <Typography sx={theme.details.metaValue}>
        {String(value || "—")}
      </Typography>
    </Box>
  );
};

  return (
    <Box p={2}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper sx={theme.details.document}>
        {/* Header */}

        <Box sx={theme.details.banner}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography sx={theme.details.bannerTitle}>
                Post Cure Details
              </Typography>

              <Typography sx={theme.details.bannerSubtitle}>
                Form ID : {details.formId ?? "-"}
              </Typography>
            </Box>

            <Chip
              label={
                details.status ||
                row?.pcStatus ||
                "Initiated"
              }
              sx={{
                color: statusConfig.color,
                background: statusConfig.bg,
                border: `1px solid ${statusConfig.border}`,
                fontWeight: 700,
              }}
            />
          </Stack>
        </Box>

        {/* Metadata */}

        <Box sx={theme.details.section}>
            <Typography sx={theme.details.sectionTitle}>
              General Information
            </Typography>

            <Box sx={theme.details.metaGrid}>
              <Box sx={theme.details.metaItem}>
                <Typography sx={theme.details.metaLabel}>
                  Form ID
                </Typography>
                <Typography sx={theme.details.metaValue}>
                  {details.formId || "—"}
                </Typography>
              </Box>

              <Box sx={theme.details.metaItem}>
                <Typography sx={theme.details.metaLabel}>
                  Status
                </Typography>
                <Typography sx={theme.details.metaValue}>
                  {details.status || row?.pcStatus || "—"}
                </Typography>
              </Box>

              <Box sx={theme.details.metaItem}>
                <Typography sx={theme.details.metaLabel}>
                  Operation Type
                </Typography>
                <Typography sx={theme.details.metaValue}>
                  {formatLabel(details.operationType)}
                </Typography>
              </Box>

              <Box sx={theme.details.metaItem}>
                <Typography sx={theme.details.metaLabel}>
                  Inhibitor Type
                </Typography>
                <Typography sx={theme.details.metaValue}>
                  {details.inhibitorType || "N/A"}
                </Typography>
              </Box>
            </Box>
          </Box>

        <Divider />

        {/* Motors */}

        <Box sx={theme.details.body}>
          {(details.motors ?? []).map(
            (
              motorWrapper: any,
              motorIndex: number
            ) => {
              const motor =
                motorWrapper?.details ??
                motorWrapper;

              return (
                <Paper
                  key={motorIndex}
                  variant="outlined"
                  sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                    >
                      Motor {motorIndex + 1}
                    </Typography>

                    <Chip
                      label={
                        motor?.motorId ?? "-"
                      }
                      color="primary"
                      size="small"
                    />
                  </Stack>

                  <Stack
                    direction={{
                      xs: "column",
                      md: "row",
                    }}
                    spacing={4}
                    mb={3}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Motor ID
                      </Typography>

                      <Typography>
                        {motor?.motorId || "—"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Receipt Date
                      </Typography>

                      <Typography>
                        {motor?.motorReceiptDate ||
                          "—"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Operation Type
                      </Typography>

                      <Typography>
                        {formatLabel(
                          motor?.operationType
                        )}
                      </Typography>
                    </Box>
                  </Stack>

                  {(motor?.sections ?? []).map(
                    (
                      section: any,
                      sectionIndex: number
                    ) => (
                      <Paper
                        key={sectionIndex}
                        variant="outlined"
                        sx={{
                          p: 2,
                          mb: 2,
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          mb={2}
                        >
                          {formatLabel(
                            section.sectionId
                          )}
                        </Typography>

                        {(
                          section.sectionData ??
                          []
                        ).map(
                          (
                            block: any,
                            blockIndex: number
                          ) => (
                            <Box
                              key={blockIndex}
                            >
                              {Object.entries(
                                block
                              ).map(
                                ([key, value]) =>
                                  renderField(
                                    key,
                                    value
                                  )
                              )}
                            </Box>
                          )
                        )}
                      </Paper>
                    )
                  )}
                </Paper>
              );
            }
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PostCureDetailsView;