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
