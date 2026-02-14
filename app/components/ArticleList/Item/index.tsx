import { Link } from "react-router";
import { memo } from "react";

import * as styles from "./styles.css";

interface Props {
  slug: string;
  title: string;
  description: string;
}

const ArticleListItem = ({ slug, title, description }: Props) => (
  <li key={slug}>
    <article className="post-list-item" itemScope itemType="http://schema.org/Article">
      <header className={styles.header}>
        <h2 className={styles.title}>
          <Link to={slug} itemProp="url">
            <span itemProp="headline">{title}</span>
          </Link>
        </h2>
      </header>
      <section className={styles.section}>
        <p
          dangerouslySetInnerHTML={{
            __html: description,
          }}
          itemProp="description"
        />
      </section>
    </article>
  </li>
);

export default memo(ArticleListItem);
