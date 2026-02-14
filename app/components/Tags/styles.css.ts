import { style } from "@vanilla-extract/css";

export const tagList = style({
  margin: 0,
});

export const tag = style({
  display: "inline-block",
  listStyle: "none",
  selectors: {
    "&::before": {
      margin: "0 0.25rem",
      content: "•",
    },
  },
});
