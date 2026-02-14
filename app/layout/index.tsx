import type { PropsWithChildren } from "react";

import Footer from "~/components/Footer";
import Header from "~/components/Header";

import * as styles from "./styles.css";

interface Props {
  title: string;
  resetFilter?: () => void;
}

const Layout = ({ title, children, resetFilter }: PropsWithChildren<Props>) => {
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Header title={title} resetFilter={resetFilter} />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
