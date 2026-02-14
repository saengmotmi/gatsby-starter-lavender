import { style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const root = style({
  display: "flex",
  minHeight: "100vh",
  color: vars.colors.text500,
  backgroundColor: vars.colors.backgroundColor,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}, background-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: vars.sizes.contentWidth,
  margin: "0 auto",
  paddingRight: "1em",
  paddingLeft: "1em",
  "@media": {
    "screen and (min-width: 48em)": {
      padding: 0,
    },
  },
});
