import { style } from "@vanilla-extract/css";

import { darkTheme, vars } from "~/styles/theme.css";

export const container = style({
  position: "relative",
  display: "inline-block",
  alignSelf: "flex-end",
  cursor: "pointer",
  userSelect: "none",
  touchAction: "pan-x",
  WebkitTapHighlightColor: "transparent",
  "@media": {
    "screen and (min-width: 48em)": {
      alignSelf: "auto",
    },
  },
});

export const checkbox = style({
  position: "absolute",
  height: "1px",
  marginLeft: "-1px",
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
});

export const track = style({
  width: "3.5rem",
  height: "2rem",
  borderRadius: "2rem",
  backgroundColor: vars.colors.themeSwitchBackground,
});

export const thumbWrapper = style({
  position: "absolute",
  top: 0,
  width: "3.5rem",
  height: "2rem",
  overflow: "hidden",
});

export const thumb = style({
  position: "absolute",
  top: "50%",
  width: "1.25rem",
  height: "1.25rem",
  borderRadius: "50%",
  backgroundColor: vars.colors.yellow,
  transform: "translate(0.5rem, -50%)",
  transition: `transform ${vars.transitions.switchTransitionDuration} ${vars.transitions.transitionTiming}`,
  WebkitTapHighlightColor: vars.colors.yellowAccent,
  selectors: {
    [`.${darkTheme} &`]: {
      transform: "translate(1.75rem, -50%)",
    },
  },
});

export const shadow = style({
  position: "absolute",
  top: "50%",
  width: "1.25rem",
  height: "1.25rem",
  borderRadius: "50%",
  backgroundColor: vars.colors.themeSwitchBackground,
  transform: "translate(0, -100%) scale(0)",
  transition: `transform ${vars.transitions.switchTransitionDuration} ${vars.transitions.transitionTiming}`,
  selectors: {
    [`.${darkTheme} &`]: {
      transform: "translate(1.35rem, -70%) scale(1)",
    },
  },
});
