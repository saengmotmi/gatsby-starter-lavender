import { useCallback, useRef } from "react";
import { useLoaderData } from "react-router";

import ArticleList from "~/components/ArticleList";
import Profile from "~/components/Profile";
import { useInfiniteScroll } from "~/hooks/useInfiniteScroll";
import { usePage } from "~/hooks/usePage";
import { allPostSummaries } from "~/lib/post-summaries";
import siteConfig from "~/lib/site-config";
import Layout from "~/layout";

const articlePerPage = 5;

export function meta() {
  const title = siteConfig.title;
  const description = siteConfig.description;
  const url = siteConfig.siteUrl;
  const canonicalUrl = url.endsWith("/") ? url : `${url}/`;
  const image = `${siteConfig.siteUrl}${siteConfig.thumbnail}`;
  const twitter = siteConfig.social.twitter?.trim();
  const twitterHandle = twitter ? (twitter.startsWith("@") ? twitter : `@${twitter}`) : null;

  const meta = [
    { title },
    { name: "description", content: description },
    { name: "author", content: siteConfig.author },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
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

  if (twitterHandle) {
    meta.push({ name: "twitter:creator", content: twitterHandle });
    meta.push({ name: "twitter:site", content: twitterHandle });
  }

  return meta;
}

export function loader() {
  return {
    posts: allPostSummaries,
  };
}

export default function Home() {
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = usePage();
  const { posts } = useLoaderData<typeof loader>();

  const totalPage = Math.max(1, Math.ceil(posts.length / articlePerPage));

  useInfiniteScroll(
    infiniteScrollRef,
    useCallback(() => {
      if (page < totalPage) {
        setPage(page + 1);
      }
    }, [page, setPage, totalPage])
  );

  const resetFilter = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const visiblePosts = posts.slice(0, Math.min(page * articlePerPage, posts.length));

  return (
    <Layout title={siteConfig.title} resetFilter={resetFilter}>
      <Profile />
      {visiblePosts.length === 0 ? <p>No posts found.</p> : <ArticleList posts={visiblePosts} />}
      <div className="infinite-scroll" ref={infiniteScrollRef} />
    </Layout>
  );
}
