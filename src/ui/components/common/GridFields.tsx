import { Box } from "@mui/material";
import type { ReactNode } from "react";

type GridFieldsProps = {
  children: ReactNode;
  columns?: number;
  gap?: number;
  direction?: "row" | "column";
  wrap?: boolean;
  defaultChildFlex?: string;
};

const GridFields = ({
  children,
  gap = 1.5,
  direction = "row",
  wrap = true,
  defaultChildFlex = "1 1 180px",
}: GridFieldsProps) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: direction,
      flexWrap: wrap ? "wrap" : "nowrap",
      gap,
      alignItems: "stretch",
      ...(defaultChildFlex && direction === "row"
        ? { "& > *:not([data-custom-flex])": { flex: defaultChildFlex, minWidth: 0 } }
        : undefined),
    }}
  >
    {children}
  </Box>
);

export default GridFields;
