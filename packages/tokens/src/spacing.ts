/** 8-point spacing system. Keys are px values for readability; values are rem for scalability. */
export const spacing = {
  0: "0px",
  1: "0.25rem", // 4
  2: "0.5rem", // 8
  3: "0.75rem", // 12
  4: "1rem", // 16
  6: "1.5rem", // 24
  8: "2rem", // 32
  10: "2.5rem", // 40
  12: "3rem", // 48
  16: "4rem", // 64
  20: "5rem", // 80
  24: "6rem", // 96
  30: "7.5rem", // 120
} as const;

export const containerWidth = {
  full: "100%",
  mobile: "390px",
  tablet: "768px",
  desktop: "1440px",
  maxContent: "1440px",
} as const;

export const breakpoints = {
  sm: "480px",
  md: "768px", // tablet
  lg: "1024px",
  xl: "1280px",
  "2xl": "1440px", // desktop max content width
} as const;

export const radius = {
  none: "0px",
  sm: "8px",
  input: "12px",
  button: "12px",
  card: "16px",
  modal: "20px",
  full: "9999px",
} as const;
