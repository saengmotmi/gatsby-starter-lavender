import ArticleNavigator from "~/components/ArticleNavigator";
import Profile from "~/components/Profile";
import Tags from "~/components/Tags";
import Utterances from "~/components/Utterances";
import { findPostByPath, getAdjacentPosts } from "~/lib/posts";
import siteConfig from "~/lib/site-config";
import Layout from "~/layout";

import type { Route } from "./+types/post";
import * as styles from "./post.styles.css";

const normalizeRoutePath = (splat: string) => {
  const path = splat.startsWith("/") ? splat : `/${splat}`;
  return path.endsWith("/") ? path : `${path}/`;
};

export function loader({ params }: Route.LoaderArgs) {
  const splat = params["*"] || "";
  const path = normalizeRoutePath(splat);
  const post = findPostByPath(path);

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  const { previousPost, nextPost } = getAdjacentPosts(post.path);

  return {
    post,
    previousPost,
    nextPost,
  };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) {
    return [{ title: `${siteConfig.title} | 404` }];
  }

  const { post } = data;
  const title = post.title;
  const description = post.description || post.excerpt;
  const imagePath = post.thumbnail || siteConfig.thumbnail;
  const image = `${siteConfig.siteUrl}${imagePath}`;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: `${siteConfig.siteUrl}${post.path}` },
    { property: "og:image", content: image },
    { name: "twitter:image", content: image },
  ];
}

export default function PostRoute({ loaderData }: Route.ComponentProps) {
  const { post, previousPost, nextPost } = loaderData;
  const commentConfig = siteConfig.comment;

  return (
    <Layout title={siteConfig.title}>
      <article className={styles.article} itemScope itemType="http://schema.org/Article">
        <header className={styles.header}>
          <h1 className={styles.title} itemProp="headline">
            {post.title}
          </h1>
          <div className={styles.articleMetadata}>
            <span>{post.date}</span>
            <Tags tags={post.tags} />
          </div>
        </header>

        {post.tableOfContents ? (
          <div className={styles.tableOfContents} dangerouslySetInnerHTML={{ __html: post.tableOfContents }} />
        ) : null}

        <section className={styles.content} dangerouslySetInnerHTML={{ __html: post.html }} itemProp="articleBody" />

        <footer className={styles.footer}>
          <Profile />
        </footer>
      </article>

      {commentConfig?.utterances ? <Utterances repo={commentConfig.utterances} /> : null}

      <ArticleNavigator previousArticle={previousPost} nextArticle={nextPost} />
    </Layout>
  );
}
