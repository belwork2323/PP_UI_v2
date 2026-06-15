import { useMemo, useState, type SyntheticEvent } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { SchemaDocumentV2, SchemaSection } from "./types";
import type { SchemaFormValues } from "./state/formState";
import type { SchemaApiContext } from "./rules/apiDependency";
import type { SchemaThemeTokens } from "./utils/schemaUtils";
import { buildFlatVisibilityContext, isSectionVisible, pruneHiddenFormValues } from "./rules/visibility";
import type { SchemaSetupContext } from "./utils/setupContext";
import BlockRenderer from "./BlockRenderer";
import AccordionSection from "../ui/components/common/AccordionSection";
import GridFields from "../ui/components/common/GridFields";

type SchemaRendererProps = {
  schema: SchemaDocumentV2;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  theme?: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  setupContext?: SchemaSetupContext;
  batch?: { batchId?: string; projectName?: string; projectId?: string };
  motorId?: string;
};

const SectionContent = ({
  section,
  ctx,
}: {
  section: SchemaSection;
  ctx: Parameters<typeof BlockRenderer>[0]["ctx"];
}) => (
  <GridFields direction={section.ui?.direction ?? "column"} wrap={section.ui?.wrap ?? true} gap={1.5}>
    {section.children.map((block) => (
      <BlockRenderer key={block.id} block={block} ctx={ctx} />
    ))}
  </GridFields>
);

const SchemaRenderer = ({
  schema,
  values,
  onChange,
  readOnly = false,
  theme,
  apiContext,
  setupContext,
  batch,
  motorId,
}: SchemaRendererProps) => {
  const visibilityContext = useMemo(() => buildFlatVisibilityContext(values), [values]);
  const layout = schema.data.ui?.layout ?? "flat";
  const sections = schema.data.sections ?? [];

  const handleChange = (next: SchemaFormValues) => {
    onChange(pruneHiddenFormValues(sections, next));
  };

  const ctx = {
    values,
    onChange: handleChange,
    readOnly,
    theme,
    apiContext,
    setupContext,
    visibilityContext,
    batch,
    motorId,
  };

  const [expandedPanels, setExpandedPanels] = useState<string[]>(() =>
    schema.data.ui?.accordion?.defaultExpanded !== false ? sections.map((s) => s.id) : [],
  );

  const handlePanelChange = (sectionId: string) => (_: SyntheticEvent, isExpanded: boolean) => {
    const allowMultiple = schema.data.ui?.accordion?.allowMultipleExpanded !== false;
    setExpandedPanels((prev) => {
      if (allowMultiple) {
        return isExpanded ? [...prev, sectionId] : prev.filter((id) => id !== sectionId);
      }
      return isExpanded ? [sectionId] : [];
    });
  };

  if (layout === "accordion") {
    return (
      <Stack spacing={1.5}>
        {sections.map((section) =>
          isSectionVisible(section, visibilityContext) ? (
            <AccordionSection
              key={section.id}
              id={section.id}
              title={section.title}
              expanded={expandedPanels.includes(section.id)}
              onChange={() => undefined}
              sx={{
                border: `1px solid ${theme?.border ?? "#D5D8DC"}`,
                borderRadius: 2,
                "&:before": { display: "none" },
              }}
            >
              <SectionContent section={section} ctx={ctx} />
            </AccordionSection>
          ) : null,
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {sections.map((section) =>
        isSectionVisible(section, visibilityContext) ? (
          <Box
            key={section.id}
            sx={{
              border: section.ui?.variant === "plain" ? "none" : `1px solid ${theme?.border ?? "#D5D8DC"}`,
              borderRadius: 2,
              p: section.ui?.padding ? 2 : 1.5,
              background: theme?.surface,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme?.text, mb: 1.5 }}>
              {section.title}
            </Typography>
            <SectionContent section={section} ctx={ctx} />
          </Box>
        ) : null,
      )}
    </Stack>
  );
};

export default SchemaRenderer;
