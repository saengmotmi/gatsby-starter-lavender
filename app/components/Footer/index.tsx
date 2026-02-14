import { memo } from "react";

import siteConfig from "~/lib/site-config";

import * as styles from "./styles.css";

const Footer = () => {
  const githubUsername = siteConfig.social?.github;
  const author = siteConfig.author;

  return (
    <footer className={styles.container}>
      © {githubUsername ? <a href={`https://github.com/${githubUsername}`}>{author}</a> : author}, Built with{" "}
      <a href="https://github.com/blurfx/gatsby-starter-lavender">gatsby-starter-lavender</a>
    </footer>
  );
};

export default memo(Footer);
