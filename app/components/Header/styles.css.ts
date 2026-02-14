import { style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const container = style({
  display: "flex",
  flexDirection: "column-reverse",
  alignItems: "center",
  width: "100%",
  margin: "0 auto",
  padding: "2rem 0",
  "@media": {
    "screen and (min-width: 48em)": {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  },
});

export const titleWrapper = style({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "start",
  width: "100%",
  "@media": {
    "screen and (min-width: 48em)": {
      width: "auto",
    },
  },
});

export const circle = style({
  width: "4rem",
  height: "4rem",
  borderRadius: "50%",
  backgroundColor: vars.colors.headerCircleColor,
  transition: `background-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const title = style({
  marginLeft: "-2.5rem",
  color: vars.colors.text400,
  fontWeight: 900,
  fontSize: "2rem",
  lineHeight: "2rem",
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});
