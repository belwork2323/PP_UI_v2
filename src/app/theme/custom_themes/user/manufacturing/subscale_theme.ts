export const SUBSCALE_BRAND = {
  primary: "#117A65",
  primaryLight: "#148F77",
  accent: "#1A5276",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  ss: "#117A65",
  ssLight: "#148F77",
  ok: "#148F77",
  okBg: "rgba(20,143,119,0.08)",
  okBorder: "rgba(20,143,119,0.25)",
  notOk: "#C0392B",
  notOkBg: "rgba(192,57,43,0.06)",
  notOkBorder: "rgba(192,57,43,0.2)",
} as const;

export const getSubscaleTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  return {
    brand: {
      ...SUBSCALE_BRAND,
      primary: palette.primary ?? SUBSCALE_BRAND.primary,
      primaryLight: palette.primaryLight ?? SUBSCALE_BRAND.primaryLight,
      accent: palette.accent ?? SUBSCALE_BRAND.accent,
      warn: palette.warn ?? SUBSCALE_BRAND.warn,
      danger: palette.danger ?? SUBSCALE_BRAND.danger,
      surface: palette.surface ?? SUBSCALE_BRAND.surface,
      border: palette.border ?? SUBSCALE_BRAND.border,
      text: palette.text ?? SUBSCALE_BRAND.text,
      textSub: palette.textSub ?? SUBSCALE_BRAND.textSub,
    },
  };
};

export default getSubscaleTheme;
