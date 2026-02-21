import { memo } from "react";
import { Link } from "react-router";

import type { PostSummary } from "~/lib/post-types";

import * as styles from "./styles.css";

interface Props {
  posts: PostSummary[];
}

const FleetingGrid = ({ posts }: Props) => {
  return (
    <ol className={styles.container}>
      {posts.map((post) => (
        <li className={styles.item} key={post.path}>
          <article className={styles.card} itemScope itemType="http://schema.org/Article">
            <Link className={styles.link} to={post.path} itemProp="url">
              <span className={styles.date}>{post.date}</span>
              <h2 className={styles.title} itemProp="headline">
                {post.title}
              </h2>
              <p className={styles.description} itemProp="description">
                {post.description || post.excerpt}
              </p>
            </Link>
          </article>
        </li>
      ))}
    </ol>
  );
};

export default memo(FleetingGrid);
