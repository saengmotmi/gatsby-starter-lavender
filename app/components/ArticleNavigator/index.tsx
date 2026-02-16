import { Link } from "react-router";

import * as styles from "./styles.css";

interface ArticleLink {
  path: string;
  title: string;
}

interface Props {
  previousArticle: ArticleLink | null;
  nextArticle: ArticleLink | null;
}

const ArticleNavigator = ({ previousArticle, nextArticle }: Props) => (
  <nav className={styles.container}>
    <ul className={styles.navigationList}>
      <li>
        {previousArticle ? (
          <Link className={styles.postLink} to={previousArticle.path} rel="prev" prefetch="viewport" viewTransition>
            ← {previousArticle.title}
          </Link>
        ) : null}
      </li>
      <li>
        {nextArticle ? (
          <Link className={styles.postLink} to={nextArticle.path} rel="next" prefetch="viewport" viewTransition>
            {nextArticle.title} →
          </Link>
        ) : null}
      </li>
    </ul>
  </nav>
);

export default ArticleNavigator;
