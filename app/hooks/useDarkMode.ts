import { useEffect } from "react";

import { darkTheme, lightTheme } from "~/styles/theme.css";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { useMedia } from "~/hooks/useMedia";
import { win } from "~/utils/window";

const usePrefersDarkMode = () => {
  return useMedia<boolean>(["(prefers-color-scheme: dark)"], [true], false);
};

type DarkModeSetter = (value: boolean | ((previousValue: boolean) => boolean)) => void;

export const useDarkMode = (): [boolean, DarkModeSetter] => {
  const [enabledState, setEnabledState] = useLocalStorage<boolean | null>("darkMode", null);
  const prefersDarkMode = usePrefersDarkMode();
  const enabled = enabledState ?? prefersDarkMode;

  useEffect(() => {
    if (!win) {
      return;
    }

    const element = win.document.body;
    if (enabled) {
      element.classList.remove(lightTheme);
      element.classList.add(darkTheme);
    } else {
      element.classList.remove(darkTheme);
      element.classList.add(lightTheme);
    }
  }, [enabled]);

  const setDarkMode: DarkModeSetter = (value) => {
    if (typeof value === "function") {
      setEnabledState((previousValue) => {
        const baseValue = previousValue ?? prefersDarkMode;
        return value(baseValue);
      });
      return;
    }

    setEnabledState(value);
  };

  return [enabled, setDarkMode];
};
