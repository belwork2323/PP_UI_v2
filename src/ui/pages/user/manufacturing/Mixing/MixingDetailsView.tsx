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
import getMixingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";

type Props = {
  row: any;
  data: any;
  loading?: boolean;
  onBack: () => void;
};

const MixingDetailsView = ({
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
    () => getMixingTheme(manufacturingTheme),
    [manufacturingTheme]
  );

  const details = data ?? {};

  const statusConfig =
    theme.details.bannerStatusConfig[
      details.status ?? "Initiated"
    ] ??
    theme.details.bannerStatusConfig["Initiated"];

  return (
    <Box sx={theme.details.page}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper sx={theme.details.document}>
        {/* Banner */}

        <Box sx={theme.details.banner}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography sx={theme.details.bannerTitle}>
                Mixing Form Details
              </Typography>

              <Typography sx={theme.details.bannerSubtitle}>
                Form ID : {details.formId}
              </Typography>
            </Box>

            <Chip
              label={details.status}
              sx={{
                color: statusConfig.color,
                background: statusConfig.bg,
                border: `1px solid ${statusConfig.border}`,
                fontWeight: 700,
              }}
            />
          </Stack>
        </Box>

        <Box sx={theme.details.body}>
          {/* Metadata */}

          <Box sx={theme.details.section}>
            <Typography sx={theme.details.sectionTitle}>
              Batch Information
            </Typography>

            <Box sx={theme.details.metaGrid}>
              <Box sx={theme.details.metaItem}>
                <Typography sx={theme.details.metaLabel}>
                  Batch Id
                </Typography>
                <Typography sx={theme.details.metaValue}>
                  {details.batchId}
                </Typography>
              </Box>

              <Box sx={theme.details.metaItem}>
                <Typography sx={theme.details.metaLabel}>
                  Batch Type
                </Typography>
                <Typography sx={theme.details.metaValue}>
                  {details.batchType}
                </Typography>
              </Box>

              <Box sx={theme.details.metaItem}>
                <Typography sx={theme.details.metaLabel}>
                  Submitted By
                </Typography>
                <Typography sx={theme.details.metaValue}>
                  {details.submittedBy ?? "-"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Stages */}

          {(details.mixingDetails?.stages ?? []).map(
            (stage: any, stageIndex: number) => (
              <Box
                key={stageIndex}
                sx={theme.details.section}
              >
                <Typography sx={theme.details.sectionTitle}>
                  {stage.stageType}
                </Typography>

                {(stage.premixes ?? []).map(
                  (premix: any, premixIndex: number) => (
                    <Box
                      key={premixIndex}
                      sx={theme.details.blockWrapper(
                        premixIndex ===
                          stage.premixes.length - 1
                      )}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography fontWeight={700}>
                          Premix {premix.premixNo}
                        </Typography>

                        <Chip
                          label={stage.stageType}
                          size="small"
                        />
                      </Stack>

                      {/* Mixer Config */}

                      <Box mb={2}>
                        <Typography
                          sx={theme.details.sectionTitle}
                        >
                          Mixer Configuration
                        </Typography>

                        <Box sx={theme.details.metaGrid}>
                          <Box sx={theme.details.metaItem}>
                            <Typography
                              sx={theme.details.metaLabel}
                            >
                              Mixer
                            </Typography>

                            <Typography
                              sx={theme.details.metaValue}
                            >
                              {
                                premix
                                  .mixerConfiguration
                                  ?.mixerId
                              }
                            </Typography>
                          </Box>

                          <Box sx={theme.details.metaItem}>
                            <Typography
                              sx={theme.details.metaLabel}
                            >
                              Building
                            </Typography>

                            <Typography
                              sx={theme.details.metaValue}
                            >
                              {
                                premix
                                  .mixerConfiguration
                                  ?.buildingNo
                              }
                            </Typography>
                          </Box>

                          <Box sx={theme.details.metaItem}>
                            <Typography
                              sx={theme.details.metaLabel}
                            >
                              Bowl
                            </Typography>

                            <Typography
                              sx={theme.details.metaValue}
                            >
                              {
                                premix
                                  .mixerConfiguration
                                  ?.bowlId
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Trial */}

                      <Box mb={2}>
                        <Typography
                          sx={theme.details.sectionTitle}
                        >
                          Trial Details
                        </Typography>

                        <Typography>
                          Date :
                          {" "}
                          {
                            premix.trialDetails
                              ?.trialDate
                          }
                        </Typography>

                        <Typography>
                          Observation :
                          {" "}
                          {
                            premix.trialDetails
                              ?.observations
                          }
                        </Typography>
                      </Box>

                      {/* Mix */}

                      <Box mb={2}>
                        <Typography
                          sx={theme.details.sectionTitle}
                        >
                          Mix Details
                        </Typography>

                        <Typography>
                          Mix Date :
                          {" "}
                          {
                            premix.mixDetails
                              ?.mixDate
                          }
                        </Typography>

                        <Typography>
                          Quantity :
                          {" "}
                          {
                            premix.mixDetails
                              ?.mixQuantity
                          }
                        </Typography>
                      </Box>

                      {/* Process Particulars */}

                      {premix.processParticulars?.map(
                        (
                          section: any,
                          sectionIndex: number
                        ) => (
                          <Box
                            key={sectionIndex}
                            mb={3}
                          >
                            <Typography
                              sx={
                                theme.details
                                  .sectionTitle
                              }
                            >
                              {
                                section.sectionName
                              }
                            </Typography>

                            <TableContainer
                              sx={
                                theme.details
                                  .tableContainer
                              }
                            >
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell
                                      sx={theme.details.tableHeaderCell(
                                        true
                                      )}
                                    >
                                      Field
                                    </TableCell>

                                    <TableCell
                                      sx={theme.details.tableHeaderCell(
                                        false
                                      )}
                                    >
                                      Value
                                    </TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {(
                                    section.rows ??
                                    []
                                  ).map(
                                    (
                                      item: any,
                                      idx: number
                                    ) => (
                                      <TableRow
                                        key={idx}
                                        sx={theme.details.tableRow(
                                          idx
                                        )}
                                      >
                                        <TableCell
                                          sx={
                                            theme
                                              .details
                                              .tableCell
                                          }
                                        >
                                          {
                                            item.fieldLabel
                                          }
                                        </TableCell>

                                        <TableCell
                                          sx={
                                            theme
                                              .details
                                              .tableCell
                                          }
                                        >
                                          {item.value}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )
                      )}

                      {/* Quality Checks */}

                      <Box>
                        <Typography
                          sx={theme.details.sectionTitle}
                        >
                          Quality Checks
                        </Typography>

                        <TableContainer
                          sx={
                            theme.details
                              .tableContainer
                          }
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  sx={theme.details.tableHeaderCell(
                                    true
                                  )}
                                >
                                  Parameter
                                </TableCell>

                                <TableCell
                                  sx={theme.details.tableHeaderCell(
                                    false
                                  )}
                                >
                                  Specification
                                </TableCell>

                                <TableCell
                                  sx={theme.details.tableHeaderCell(
                                    false
                                  )}
                                >
                                  Observed Values
                                </TableCell>
                              </TableRow>
                            </TableHead>

                            <TableBody>
                              <TableRow>
                                <TableCell>
                                  Moisture %
                                </TableCell>
                                <TableCell>
                                  {
                                    premix
                                      .qualityChecks
                                      ?.moisturePercentage
                                      ?.specification
                                  }
                                </TableCell>
                                <TableCell>
                                  {(
                                    premix
                                      .qualityChecks
                                      ?.moisturePercentage
                                      ?.observedValues ??
                                    []
                                  ).join(", ")}
                                </TableCell>
                              </TableRow>

                              <TableRow>
                                <TableCell>
                                  EOM Viscosity
                                </TableCell>
                                <TableCell>
                                  {
                                    premix
                                      .qualityChecks
                                      ?.eomViscosity
                                      ?.specification
                                  }
                                </TableCell>
                                <TableCell>
                                  {(
                                    premix
                                      .qualityChecks
                                      ?.eomViscosity
                                      ?.observedValues ??
                                    []
                                  ).join(", ")}
                                </TableCell>
                              </TableRow>

                              <TableRow>
                                <TableCell>
                                  EOM Temperature
                                </TableCell>
                                <TableCell>
                                  {
                                    premix
                                      .qualityChecks
                                      ?.eomTemperature
                                      ?.specification
                                  }
                                </TableCell>
                                <TableCell>
                                  {(
                                    premix
                                      .qualityChecks
                                      ?.eomTemperature
                                      ?.observedValues ??
                                    []
                                  ).join(", ")}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Divider sx={{ my: 3 }} />
                      </Box>
                    </Box>
                  )
                )}
              </Box>
            )
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MixingDetailsView;