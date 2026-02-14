import { style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const container = style({
  margin: "1rem auto",
});

export const navigationList = style({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  margin: 0,
  listStyle: "none",
});

export const postLink = style({
  display: "block",
  padding: "0.5rem 1rem",
  borderRadius: "0.5rem",
  color: vars.colors.link,
  fontSize: "0.875rem",
});
