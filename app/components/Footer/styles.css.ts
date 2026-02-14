import { style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const container = style({
  marginTop: "auto",
  paddingTop: "2rem",
  paddingBottom: "1.5rem",
  color: vars.colors.text100,
  fontSize: "0.875rem",
  textAlign: "center",
});
