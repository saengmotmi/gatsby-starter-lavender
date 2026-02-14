import { style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const header = style({
  margin: "1rem auto",
});

export const title = style({
  color: vars.colors.text500,
  fontSize: "1.5rem",
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const section = style({
  marginBottom: "3rem",
  color: vars.colors.text200,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});
