import { useCallback, useRef } from "react";

import ArticleList from "~/components/ArticleList";
import Profile from "~/components/Profile";
import { useInfiniteScroll } from "~/hooks/useInfiniteScroll";
import { usePage } from "~/hooks/usePage";
import { allPosts } from "~/lib/posts";
import siteConfig from "~/lib/site-config";
import Layout from "~/layout";

const articlePerPage = 5;

export function meta() {
  const title = siteConfig.title;
  const description = siteConfig.description;
  const image = `${siteConfig.siteUrl}${siteConfig.thumbnail}`;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { name: "twitter:image", content: image },
  ];
}

export default function Home() {
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = usePage();
  const posts = allPosts;

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
