import { Activity, useEffect, useState, useTransition } from "react";

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
  const url = `${siteConfig.siteUrl}${post.path}`;
  const canonicalUrl = url.endsWith("/") ? url : `${url}/`;
  const imagePath = post.thumbnail || siteConfig.thumbnail;
  const image = `${siteConfig.siteUrl}${imagePath}`;
  const twitter = siteConfig.social.twitter?.trim();
  const twitterHandle = twitter ? (twitter.startsWith("@") ? twitter : `@${twitter}`) : null;
  const publishedAt = new Date(post.date);
  const publishedAtIso = Number.isNaN(publishedAt.getTime()) ? null : publishedAt.toISOString();

  const meta = [
    { title },
    { name: "description", content: description },
    { name: "author", content: siteConfig.author },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: siteConfig.title },
    { property: "og:locale", content: "ko_KR" },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:alt", content: title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:url", content: url },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
  ];

  if (publishedAtIso) {
    meta.push({ property: "article:published_time", content: publishedAtIso });
  }

  meta.push({ property: "article:author", content: siteConfig.author });

  for (const tag of post.tags) {
    meta.push({ property: "article:tag", content: tag });
  }

  if (twitterHandle) {
    meta.push({ name: "twitter:creator", content: twitterHandle });
    meta.push({ name: "twitter:site", content: twitterHandle });
  }

  return meta;
}

export default function PostRoute({ loaderData }: Route.ComponentProps) {
  const { post, previousPost, nextPost } = loaderData;
  const commentConfig = siteConfig.comment;
  const [isPending, startTransition] = useTransition();
  const [isTableOfContentsVisible, setIsTableOfContentsVisible] = useState(Boolean(post.tableOfContents));
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const hasComments = Boolean(commentConfig?.utterances);

  useEffect(() => {
    setIsTableOfContentsVisible(Boolean(post.tableOfContents));
    setIsCommentsVisible(false);
    setHasLoadedComments(false);
  }, [post.path, post.tableOfContents]);

  const onToggleTableOfContents = () => {
    if (!post.tableOfContents) {
      return;
    }

    startTransition(() => {
      setIsTableOfContentsVisible((visible) => !visible);
    });
  };

  const onToggleComments = () => {
    if (!hasComments) {
      return;
    }

    if (!isCommentsVisible) {
      setHasLoadedComments(true);
    }

    startTransition(() => {
      setIsCommentsVisible((visible) => !visible);
    });
  };

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
          <div className={styles.controls}>
            {post.tableOfContents ? (
              <button
                type="button"
                className={styles.controlButton}
                onClick={onToggleTableOfContents}
                aria-pressed={isTableOfContentsVisible}
              >
                {isTableOfContentsVisible ? "목차 숨기기" : "목차 보기"}
              </button>
            ) : null}
            {hasComments ? (
              <button
                type="button"
                className={styles.controlButton}
                onClick={onToggleComments}
                aria-pressed={isCommentsVisible}
              >
                {isCommentsVisible ? "댓글 숨기기" : "댓글 보기"}
              </button>
            ) : null}
            {isPending ? <span className={styles.pending}>전환 중...</span> : null}
          </div>
        </header>

        {post.tableOfContents ? (
          <Activity mode={isTableOfContentsVisible ? "visible" : "hidden"} name="post-table-of-contents">
            <div
              className={styles.tableOfContents}
              hidden={!isTableOfContentsVisible}
              dangerouslySetInnerHTML={{ __html: post.tableOfContents }}
            />
          </Activity>
        ) : null}

        <section className={styles.content} dangerouslySetInnerHTML={{ __html: post.html }} itemProp="articleBody" />

        <footer className={styles.footer}>
          <Profile />
        </footer>
      </article>

      {commentConfig?.utterances && hasLoadedComments ? (
        <Activity mode={isCommentsVisible ? "visible" : "hidden"} name="post-comments">
          <div hidden={!isCommentsVisible}>
            <Utterances repo={commentConfig.utterances} />
          </div>
        </Activity>
      ) : null}

      <ArticleNavigator previousArticle={previousPost} nextArticle={nextPost} />
    </Layout>
  );
}
