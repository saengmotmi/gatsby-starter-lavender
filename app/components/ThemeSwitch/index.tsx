import { memo } from "react";

import { useDarkMode } from "~/hooks/useDarkMode";

import * as styles from "./styles.css";

const ThemeSwitch = () => {
  const [darkMode, setDarkMode] = useDarkMode();

  const onThemeSwitchClick = () => {
    setDarkMode((previousMode) => !previousMode);
  };

  return (
    <div className={styles.container} role="button" aria-pressed={darkMode} onClick={onThemeSwitchClick}>
      <div className={styles.track} />
      <div className={styles.thumbWrapper}>
        <div className={styles.thumb} />
        <div className={styles.shadow} />
      </div>
      <input className={styles.checkbox} type="checkbox" aria-label="Theme Switch" defaultChecked={darkMode} />
    </div>
  );
};

export default memo(ThemeSwitch);
