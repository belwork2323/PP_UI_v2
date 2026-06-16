import { useMemo } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { STRINGS } from "../../../../../app/config/strings";
import {
  canLoadPostCureForm,
  createPostCureData,
  POST_CURE_INHIBITOR_TYPE_OPTIONS,
  POST_CURE_OPERATION_OPTIONS,
  resolvePostCureMotorOptions,
} from "../../../../../hooks/user/manufacturing/postCureConfig";
import usePostCureFormHook from "../../../../../hooks/user/manufacturing/usePostCureFormHook";
import type { PostCureFormState } from "../../../../../data/models/user/PostCureFormModel";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";
import PostCureSchemaPanel from "./PostCureSchemaPanel";

const S = STRINGS.MANUFACTURING.POST_CURE;

type PostCureFormProps = {
  batch?: {
    batchId?: string;
    motorId?: string;
    motorIds?: Array<string | number>;
  } | null;
  formData?: PostCureFormState;
  subDepartmentId?: number;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onSetupChange?: (payload: PostCureFormState) => void;
  onSchemaValuesChange?: (values: PostCureFormState["schemaFormValues"]) => void;
  onLoadForm?: () => void;
  theme: any;
};

const PostCureForm = ({
  batch,
  formData = createPostCureData(),
  subDepartmentId,
  schemaLoading = false,
  schemaError = null,
  onSetupChange,
  onSchemaValuesChange,
  onLoadForm,
  theme,
}: PostCureFormProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const schemaFormLoaded = Boolean(formData.schemaFormLoaded);

  const {
    motorId,
    setMotorId,
    motorReceiptDate,
    setMotorReceiptDate,
    operation,
    setOperation,
    inhibitorType,
    setInhibitorType,
    showInhibitionFields,
  } = usePostCureFormHook(formData, onSetupChange);

  const motorOptions = useMemo(() => resolvePostCureMotorOptions(batch), [batch]);

  const showLoadButton = useMemo(
    () =>
      canLoadPostCureForm({
        motorId,
        motorReceiptDate,
        operation,
        inhibitorType,
        schemaFormLoaded,
      }),
    [motorId, motorReceiptDate, operation, inhibitorType, schemaFormLoaded],
  );

  if (schemaFormLoaded) {
    return (
      <Box>
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: { xs: 1.25, sm: 1.5 },
            py: 1.25,
            mb: 1.25,
          }}
        >
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: theme.palette.primary, mb: 1 }}>
            {S.PANEL_TITLE}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            <DetailItem label={S.MOTOR_ID_LABEL} value={motorId} />
            <DetailItem label={S.MOTOR_RECEIPT_DATE_LABEL} value={motorReceiptDate} />
            <DetailItem
              label={S.OPERATION_LABEL}
              value={
                POST_CURE_OPERATION_OPTIONS.find((option) => option.value === operation)?.label ?? operation
              }
            />
            {showInhibitionFields ? (
              <DetailItem
                label={S.INHIBITOR_TYPE_LABEL}
                value={
                  POST_CURE_INHIBITOR_TYPE_OPTIONS.find((option) => option.value === inhibitorType)?.label ??
                  inhibitorType
                }
              />
            ) : null}
          </Box>
        </Box>

        <PostCureSchemaPanel
          schema={formData.postCureSchema}
          formValues={formData.schemaFormValues}
          savedSections={formData.savedSections}
          subDepartmentId={subDepartmentId}
          batchId={batch?.batchId}
          motorId={motorId}
          onChange={(values) => onSchemaValuesChange?.(values)}
          loading={schemaLoading}
          error={schemaError}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.border}`,
        background: theme.palette.surface,
        px: { xs: 1.25, sm: 1.5 },
        py: 1.25,
      }}
    >
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: theme.palette.primary, mb: 1.5 }}>
        {S.PANEL_TITLE}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            flexWrap: "wrap",
            gap: 2,
            alignItems: { md: "flex-end" },
          }}
        >
          <CasePrepSelect
            label={S.MOTOR_ID_LABEL}
            value={motorId}
            placeholder={S.MOTOR_ID_PLACEHOLDER}
            options={motorOptions}
            width={260}
            theme={theme}
            onChange={setMotorId}
          />

          <Box sx={flowBar.selectField?.(260)}>
            <Typography component="label" sx={flowBar.selectLabel}>
              {S.MOTOR_RECEIPT_DATE_LABEL}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
              <DatePicker
                enableAccessibleFieldDOMStructure={false}
                format="DD-MM-YYYY"
                value={motorReceiptDate ? dayjs(motorReceiptDate, "DD-MM-YYYY") : null}
                onChange={(picked) => setMotorReceiptDate(picked?.format("DD-MM-YYYY") || "")}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    placeholder: S.MOTOR_RECEIPT_DATE_PLACEHOLDER,
                    sx: flowBar.selectInput?.(Boolean(motorReceiptDate)),
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          <CasePrepSelect
            label={S.OPERATION_LABEL}
            value={operation}
            placeholder={S.OPERATION_PLACEHOLDER}
            options={POST_CURE_OPERATION_OPTIONS}
            width={260}
            theme={theme}
            onChange={setOperation}
          />
        </Box>

        {showInhibitionFields ? (
          <Box
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.border}`,
              background: "rgba(21,101,192,0.03)",
              px: 1.25,
              py: 1.25,
            }}
          >
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.primary, mb: 1.25 }}>
              {S.INHIBITION_SECTION_TITLE}
            </Typography>

            <CasePrepSelect
              label={S.INHIBITOR_TYPE_LABEL}
              value={inhibitorType}
              placeholder={S.INHIBITOR_TYPE_PLACEHOLDER}
              options={POST_CURE_INHIBITOR_TYPE_OPTIONS}
              width={260}
              theme={theme}
              onChange={setInhibitorType}
            />
          </Box>
        ) : null}

        {showLoadButton ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="small"
              onClick={onLoadForm}
              disabled={schemaLoading}
              startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {schemaLoading ? S.SCHEMA_LOADING : S.LOAD_FORM}
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "text.secondary", mb: 0.25 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", wordBreak: "break-word" }}>
      {value || "—"}
    </Typography>
  </Box>
);

export default PostCureForm;
