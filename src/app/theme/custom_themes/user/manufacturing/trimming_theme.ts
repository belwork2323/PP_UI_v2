export const TRIMMING_BRAND = {
  primary: "#6A1B9A",
  primaryLight: "#8E24AA",
  accent: "#4527A0",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  tr: "#6A1B9A",
  trLight: "#8E24AA",
  ok: "#6A1B9A",
  okBg: "rgba(106,27,154,0.08)",
  okBorder: "rgba(106,27,154,0.25)",
  notOk: "#C0392B",
  notOkBg: "rgba(192,57,43,0.06)",
  notOkBorder: "rgba(192,57,43,0.2)",
} as const;

export const getTrimmingTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  return {
    brand: {
      ...TRIMMING_BRAND,
      primary: palette.primary ?? TRIMMING_BRAND.primary,
      primaryLight: palette.primaryLight ?? TRIMMING_BRAND.primaryLight,
      accent: palette.accent ?? TRIMMING_BRAND.accent,
      warn: palette.warn ?? TRIMMING_BRAND.warn,
      danger: palette.danger ?? TRIMMING_BRAND.danger,
      surface: palette.surface ?? TRIMMING_BRAND.surface,
      border: palette.border ?? TRIMMING_BRAND.border,
      text: palette.text ?? TRIMMING_BRAND.text,
      textSub: palette.textSub ?? TRIMMING_BRAND.textSub,
    },
  };
};

export default getTrimmingTheme;
