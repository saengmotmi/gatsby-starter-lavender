import { Link } from "react-router";
import { memo } from "react";

import ThemeSwitch from "~/components/ThemeSwitch";

import * as styles from "./styles.css";

interface Props {
  title: string;
  resetFilter?: () => void;
}

const Header = ({ title, resetFilter }: Props) => {
  return (
    <header className={styles.container}>
      <div className={styles.titleWrapper}>
        <div className={styles.circle} />
        <h1 className={styles.title}>
          <Link to="/" onClick={resetFilter}>
            {title}
          </Link>
        </h1>
      </div>
      <ThemeSwitch />
    </header>
  );
};

export default memo(Header);
