import { style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const listFilter = style({
  display: "inline-flex",
  gap: "0.5rem",
  marginBottom: "1.35rem",
  padding: "0.3rem",
  borderRadius: "999px",
  backgroundColor: vars.colors.titleFilterBackground,
  transition: `background-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const filterButton = style({
  border: 0,
  borderRadius: "999px",
  padding: "0.45rem 0.95rem",
  color: vars.colors.text300,
  backgroundColor: "transparent",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}, background-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const filterButtonSelected = style([
  filterButton,
  {
    color: vars.colors.text500,
    backgroundColor: vars.colors.backgroundColor,
  },
]);

export const emptyMessage = style({
  marginTop: "0.75rem",
  marginBottom: "2rem",
  color: vars.colors.text200,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});
