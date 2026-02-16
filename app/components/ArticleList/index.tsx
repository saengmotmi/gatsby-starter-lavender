import { memo } from "react";
import type { PrefetchBehavior } from "react-router";

import type { PostSummary } from "~/lib/post-types";
import ArticleListItem from "~/components/ArticleList/Item";

import * as styles from "./styles.css";

interface Props {
  posts: PostSummary[];
}

const ArticleList = ({ posts }: Props) => {
  return (
    <ol className={styles.container}>
      {posts.map((post, index) => {
        const title = post.title;
        const description = post.description || post.excerpt;
        const prefetch: PrefetchBehavior = index < 2 ? "viewport" : "intent";

        return (
          <ArticleListItem
            key={post.path}
            title={title}
            slug={post.path}
            description={description}
            prefetch={prefetch}
          />
        );
      })}
    </ol>
  );
};

export default memo(ArticleList);
