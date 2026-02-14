import { globalStyle, style } from "@vanilla-extract/css";

import { vars } from "~/styles/theme.css";

export const globalStyleMarker = style({});

globalStyle(":root", {
  fontFamily:
    '"Pretendard", apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  textRendering: "optimizeLegibility",
});

globalStyle("*", {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
});

globalStyle("html", {
  minHeight: "100vh",
});

globalStyle("body", {
  minHeight: "100vh",
  color: vars.colors.text500,
  backgroundColor: vars.colors.backgroundColor,
  transition: `color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}, background-color ${vars.transitions.transitionDuration} ${vars.transitions.transitionTiming}`,
});

globalStyle("a", {
  color: "inherit",
  textDecoration: "none",
});

globalStyle("h1", { fontSize: "1.75rem" });
globalStyle("h2", { fontSize: "1.5rem" });
globalStyle("h3", { fontSize: "1.25rem" });
globalStyle("h4", { fontSize: "1rem" });
globalStyle("h5", { fontSize: "0.875rem" });
globalStyle("h6", { fontSize: "0.75rem" });

globalStyle("hr", {
  marginTop: "0.25rem",
  marginBottom: "0.25rem",
  border: 0,
  borderTop: `0.125rem solid ${vars.colors.borderGray}`,
});

globalStyle("img", {
  display: "block",
  margin: "0 auto",
  maxWidth: "100%",
});

globalStyle("table", {
  width: "100%",
  marginTop: "0.75rem",
  marginBottom: "0.75rem",
  borderCollapse: "collapse",
  lineHeight: "1.75rem",
});

globalStyle("tr", {
  borderBottom: `1px solid ${vars.colors.borderGray}`,
});

globalStyle("th", {
  paddingTop: "0.75rem",
  paddingBottom: "0.75rem",
});

globalStyle("td", {
  paddingTop: "0.75rem",
  paddingBottom: "0.75rem",
});

globalStyle("p", {
  marginTop: "0.75rem",
  marginBottom: "0.75rem",
  lineHeight: 1.625,
});

globalStyle('p > code[class*="language-"]', {
  whiteSpace: "pre-wrap",
});

globalStyle("blockquote", {
  paddingLeft: "1rem",
  borderLeft: `0.25rem solid ${vars.colors.borderPrimary}`,
});

globalStyle("article", {
  overflowWrap: "break-word",
});

globalStyle("article ul, article ol", {
  marginLeft: "2rem",
});

globalStyle("article ul ul, article ul ol, article ol ul, article ol ol", {
  marginLeft: "1.5rem",
});

globalStyle("article li", {
  marginTop: "0.375rem",
  marginBottom: "0.375rem",
});

globalStyle("article li p", {
  margin: 0,
});

globalStyle('article pre[class^="language-"]', {
  borderRadius: "0.25rem",
});

globalStyle(':not(pre) > code', {
  padding: "0.1em 0.3em",
  borderRadius: "0.3em",
  color: vars.colors.inlineCodeColor,
  background: vars.colors.inlineCodeBackground,
  fontSize: "0.95em",
});

globalStyle(".infinite-scroll", {
  width: "100%",
  height: "1px",
});

globalStyle(".heading-anchor", {
  marginLeft: "0.25rem",
  borderBottom: 0,
  textDecoration: "none",
  opacity: 0.7,
});

globalStyle(".heading-anchor:hover", {
  opacity: 1,
});

globalStyle(".heading-anchor .icon-link::before", {
  content: "#",
  fontSize: "0.875rem",
  fontWeight: 700,
});
