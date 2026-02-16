import type { PropsWithChildren } from "react";

import Footer from "~/components/Footer";
import Header from "~/components/Header";

import * as styles from "./styles.css";

interface Props {
  title: string;
}

const Layout = ({ title, children }: PropsWithChildren<Props>) => {
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Header title={title} />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
