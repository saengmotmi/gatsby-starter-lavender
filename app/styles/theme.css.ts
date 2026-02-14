import { createTheme, createThemeContract } from "@vanilla-extract/css";

export const vars = createThemeContract({
  colors: {
    gray100: null,
    gray200: null,
    gray300: null,
    gray400: null,
    gray500: null,
    gray600: null,
    gray700: null,
    white: null,
    black: null,
    yellow: null,
    yellowAccent: null,

    primary100: null,
    primary200: null,
    primary300: null,
    primary400: null,
    primary500: null,

    text100: null,
    text200: null,
    text300: null,
    text400: null,
    text500: null,

    backgroundColor: null,

    borderGray: null,
    borderPrimary: null,

    inlineCodeBackground: null,
    inlineCodeColor: null,
    link: null,

    titleFilterBackground: null,
    tagColor: null,
    tagFilterBackground: null,

    headerCircleColor: null,

    themeSwitchBackground: null,
  },
  sizes: {
    contentWidth: null,
  },
  transitions: {
    transitionDuration: null,
    transitionTiming: null,
    switchTransitionDuration: null,
  },
});

const themeCommon = {
  sizes: {
    contentWidth: "43.75rem",
  },
  transitions: {
    transitionDuration: "0.2s",
    transitionTiming: "ease-in",
    switchTransitionDuration: "0.1s",
  },
};

export const lightTheme = createTheme(vars, {
  colors: {
    gray100: "#f6f6f6",
    gray200: "#ddd",
    gray300: "#a0aec0",
    gray400: "#68768a",
    gray500: "#495467",
    gray600: "#2d3748",
    gray700: "#1a202c",
    white: "#fff",
    black: "#000",
    yellow: "#ffd75e",
    yellowAccent: "#ffa659",

    primary100: "#edeafc",
    primary200: "#bcb2f5",
    primary300: "#816eec",
    primary400: "#3b1de2",
    primary500: "#24128a",

    text100: "#a0aec0",
    text200: "#68768a",
    text300: "#495467",
    text400: "#2d3748",
    text500: "#1a202c",

    backgroundColor: "#fff",

    borderGray: "#ddd",
    borderPrimary: "#bcb2f5",

    inlineCodeBackground: "#404040",
    inlineCodeColor: "#ffc7d2",
    link: "#3b1de2",

    titleFilterBackground: "#f6f6f6",
    tagColor: "#3b1de2",
    tagFilterBackground: "#edeafc",

    headerCircleColor: "#bcb2f5",

    themeSwitchBackground: "#495467",
  },
  ...themeCommon,
});

export const darkTheme = createTheme(vars, {
  colors: {
    gray100: "#303136",
    gray200: "#3d4144",
    gray300: "#d6cfc4",
    gray400: "#b8ae9f",
    gray500: "#cfc8bc",
    gray600: "#e5dfd6",
    gray700: "#f6f1ea",
    white: "#fff",
    black: "#222425",
    yellow: "#ffd75e",
    yellowAccent: "#ffa659",

    primary100: "#edeafc",
    primary200: "#b9acff",
    primary300: "#816eec",
    primary400: "#3b1de2",
    primary500: "#221182",

    text100: "#d6cfc4",
    text200: "#b8ae9f",
    text300: "#cfc8bc",
    text400: "#e5dfd6",
    text500: "#f6f1ea",

    backgroundColor: "#222425",

    borderGray: "#3d4144",
    borderPrimary: "#b9acff",

    inlineCodeBackground: "#404040",
    inlineCodeColor: "#ffc7d2",
    link: "#b9acff",

    titleFilterBackground: "#3d4144",
    tagColor: "#3b1de2",
    tagFilterBackground: "#edeafc",

    headerCircleColor: "#3d4144",

    themeSwitchBackground: "#cfc8bc",
  },
  ...themeCommon,
});
