import { style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const container = style({
  display: "grid",
  gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
  gap: "1rem",
  marginLeft: 0,
  listStyle: "none",
  "@media": {
    "screen and (min-width: 40em)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
  },
});

export const item = style({
  listStyle: "none",
});

export const card = style({
  height: "100%",
  borderRadius: "0.9rem",
  border: `1px solid ${vars.colors.borderGray}`,
  backgroundColor: vars.colors.gray100,
  transition: `border-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}, background-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const link = style({
  display: "flex",
  flexDirection: "column",
  gap: "0.65rem",
  height: "100%",
  padding: "1rem 1.1rem",
});

export const date = style({
  color: vars.colors.text200,
  fontSize: "0.9rem",
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const title = style({
  color: vars.colors.text500,
  fontSize: "1.2rem",
  lineHeight: 1.35,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const description = style({
  color: vars.colors.text300,
  lineHeight: 1.55,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});
