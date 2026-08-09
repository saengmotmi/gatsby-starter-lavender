import { globalStyle, style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const article = style({
  position: "relative",
});

globalStyle(`${article} .heading-anchor`, {
  borderBottom: 0,
});

globalStyle(`${article} .heading-anchor svg`, {
  fill: vars.colors.text500,
});

export const tableOfContents = style({
  marginBottom: "1.5rem",
});

globalStyle(`${tableOfContents} > ul`, {
  marginLeft: 0,
});

globalStyle(`${tableOfContents} ul`, {
  listStyle: "none",
});

globalStyle(`${tableOfContents} li`, {
  paddingTop: "0.125rem",
  paddingBottom: "0.125rem",
  color: vars.colors.text200,
  fontSize: "0.875rem",
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

globalStyle(`${tableOfContents} li a`, {
  textDecoration: "underline",
});

globalStyle(`${tableOfContents} .toc-depth-3`, {
  paddingLeft: "1rem",
});

globalStyle(`${tableOfContents} .toc-depth-4`, {
  paddingLeft: "2rem",
});

globalStyle(`${tableOfContents} .toc-depth-5`, {
  paddingLeft: "3rem",
});

export const header = style({
  marginBottom: "2rem",
});

export const title = style({
  fontSize: "2.25rem",
});

export const articleMetadata = style({
  display: "flex",
  alignItems: "center",
  marginTop: "0.5rem",
  color: vars.colors.text200,
  fontWeight: 700,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

export const content = style({
  wordBreak: "keep-all",
});

globalStyle(`${content} .image-slider`, {
  position: "relative",
  left: "50%",
  display: "flex",
  gap: "0.75rem",
  width: "calc(100vw - 2rem)",
  maxWidth: "72rem",
  marginTop: "2.5rem",
  marginBottom: "2.5rem",
  padding: "0 0.25rem 0.75rem",
  overflowX: "auto",
  overscrollBehaviorInline: "contain",
  scrollPaddingInline: "0.25rem",
  scrollSnapType: "x mandatory",
  transform: "translateX(-50%)",
  WebkitOverflowScrolling: "touch",
  "@media": {
    "screen and (hover: hover) and (pointer: fine)": {
      scrollbarColor: "transparent transparent",
      scrollbarWidth: "thin",
    },
  },
});

globalStyle(`${content} .image-slider:hover`, {
  "@media": {
    "screen and (hover: hover) and (pointer: fine)": {
      scrollbarColor: `${vars.colors.text200} transparent`,
    },
  },
});

globalStyle(`${content} .image-slider::-webkit-scrollbar`, {
  "@media": {
    "screen and (hover: hover) and (pointer: fine)": {
      height: "0.5rem",
    },
  },
});

globalStyle(`${content} .image-slider::-webkit-scrollbar-track`, {
  "@media": {
    "screen and (hover: hover) and (pointer: fine)": {
      backgroundColor: "transparent",
    },
  },
});

globalStyle(`${content} .image-slider::-webkit-scrollbar-thumb`, {
  "@media": {
    "screen and (hover: hover) and (pointer: fine)": {
      borderRadius: "999px",
      backgroundColor: "transparent",
    },
  },
});

globalStyle(
  `${content} .image-slider:hover::-webkit-scrollbar-thumb, ${content} .image-slider::-webkit-scrollbar-thumb:active`,
  {
    "@media": {
      "screen and (hover: hover) and (pointer: fine)": {
        backgroundColor: vars.colors.text200,
      },
    },
  }
);

globalStyle(`${content} .image-slider:focus-visible`, {
  borderRadius: "0.25rem",
  outline: `0.125rem solid ${vars.colors.borderPrimary}`,
  outlineOffset: "0.25rem",
});

globalStyle(`${content} .image-slider > figure`, {
  flex: "0 0 auto",
  width: "auto",
  height: "clamp(22rem, 56vw, 40rem)",
  maxWidth: "82vw",
  margin: 0,
  aspectRatio: "var(--image-slider-aspect-ratio, 4 / 5)",
  scrollSnapAlign: "start",
  scrollSnapStop: "always",
});

globalStyle(`${content} .image-slider > figure > .blur-image-wrapper`, {
  width: "100%",
  height: "100%",
  backgroundColor: vars.colors.gray100,
});

globalStyle(`${content} .image-slider > figure > img`, {
  width: "100%",
  height: "100%",
  margin: 0,
  objectFit: "contain",
  backgroundColor: vars.colors.gray100,
});

globalStyle(`${content} .image-slider figcaption`, {
  marginTop: "0.5rem",
  color: vars.colors.text200,
  fontSize: "0.875rem",
  lineHeight: 1.5,
  textAlign: "center",
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

globalStyle(`${content} h1`, {
  marginTop: "2rem",
  marginBottom: "1.25rem",
  paddingBottom: "0.25rem",
  borderBottom: `1px solid ${vars.colors.borderGray}`,
});

globalStyle(`${content} h1 a`, {
  borderBottom: "none",
});

globalStyle(`${content} h2`, {
  marginTop: "1.5rem",
  marginBottom: "1rem",
  paddingBottom: "0.25rem",
  borderBottom: `1px solid ${vars.colors.borderGray}`,
});

globalStyle(`${content} h2 a`, {
  borderBottom: "none",
});

globalStyle(`${content} a`, {
  borderBottom: `1px solid ${vars.colors.borderPrimary}`,
  color: vars.colors.link,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}, border-bottom-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

globalStyle(`${content} pre code`, {
  wordBreak: "break-all",
  overflowWrap: "break-word",
});

globalStyle(`${content} pre, ${content} code`, {
  fontVariantLigatures: "none",
});

export const footer = style({
  selectors: {
    "&::before": {
      display: "block",
      width: "100%",
      height: "0.2rem",
      margin: "3rem auto",
      backgroundColor: vars.colors.primary200,
      transition: `background-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
      content: "",
    },
  },
});
