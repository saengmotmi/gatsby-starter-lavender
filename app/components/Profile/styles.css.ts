import { globalStyle, style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const container = style({
  display: "grid",
  gridTemplateColumns: "70px auto",
  marginBottom: "2rem",
  padding: "1rem",
  borderRadius: "1rem",
  backgroundColor: vars.colors.gray100,
  transition: `background-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

globalStyle(`${container} .profile-image`, {
  borderRadius: "50%",
  transform: "translateZ(0)",
});

export const wrapper = style({
  paddingRight: "1rem",
  paddingLeft: "1rem",
  color: vars.colors.text300,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const name = style({
  marginTop: 0,
  marginBottom: "0.5rem",
  fontSize: "1.25rem",
});

export const description = style({
  lineHeight: 1.2,
  wordBreak: "keep-all",
});

export const externalLinks = style({
  display: "flex",
  gap: "1em",
  marginTop: "1em",
  marginLeft: 0,
});

export const linkItem = style({
  display: "inline-block",
  color: vars.colors.link,
  listStyle: "none",
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});
