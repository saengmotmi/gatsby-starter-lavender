import { useCallback, useMemo } from "react";
import { useLoaderData, useSearchParams } from "react-router";

import ArticleList from "~/components/ArticleList";
import FleetingGrid from "~/components/FleetingGrid";
import Profile from "~/components/Profile";
import { allPostSummaries } from "~/lib/post-summaries";
import type { PostType } from "~/lib/post-types";
import siteConfig from "~/lib/site-config";
import { toAbsoluteUrl, toOgImageUrl } from "~/lib/urls";
import Layout from "~/layout";
import * as styles from "~/routes/home.styles.css";

const listTypes: Array<{ value: PostType; label: string }> = [
  { value: "article", label: "Article" },
  { value: "fleeting", label: "Fleeting" },
];

const parseListType = (value: string | null): PostType => {
  if (value === "fleeting") {
    return "fleeting";
  }

  return "article";
};

const applyListTypeToParams = (params: URLSearchParams, listType: PostType) => {
  if (listType === "article") {
    params.delete("type");
    return;
  }

  params.set("type", listType);
};
export function meta() {
  const title = siteConfig.title;
  const description = siteConfig.description;
  const url = toAbsoluteUrl("/");
  const canonicalUrl = url;
  const image = toOgImageUrl("/og/index.png");
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { posts } = useLoaderData<typeof loader>();
  const selectedListType = parseListType(searchParams.get("type"));

  const filteredPosts = useMemo(
    () => posts.filter((post) => post.type === selectedListType),
    [posts, selectedListType]
  );

  const changeListType = useCallback(
    (nextType: PostType) => {
      if (nextType === selectedListType) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams);
      applyListTypeToParams(nextParams, nextType);
      setSearchParams(nextParams);
    },
    [searchParams, selectedListType, setSearchParams]
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.title,
        url: siteConfig.siteUrl,
        description: siteConfig.description,
        inLanguage: "ko-KR",
      },
      {
        "@type": "Blog",
        name: siteConfig.title,
        url: siteConfig.siteUrl,
        description: siteConfig.description,
        inLanguage: "ko-KR",
        publisher: {
          "@type": "Person",
          name: siteConfig.author,
        },
      },
    ],
  };
  const structuredDataJson = JSON.stringify(structuredData).replaceAll("<", "\\u003c");

  return (
    <Layout title={siteConfig.title}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson }} />
      <Profile />
      <nav className={styles.listFilter} aria-label="목록 유형 선택">
        {listTypes.map((listType) => {
          const isSelected = listType.value === selectedListType;

          return (
            <button
              className={isSelected ? styles.filterButtonSelected : styles.filterButton}
              key={listType.value}
              onClick={() => changeListType(listType.value)}
              type="button"
            >
              {listType.label}
            </button>
          );
        })}
      </nav>
      {filteredPosts.length === 0 ? (
        <p className={styles.emptyMessage}>아직 {selectedListType} 포스트가 없습니다.</p>
      ) : selectedListType === "fleeting" ? (
        <FleetingGrid posts={filteredPosts} />
      ) : (
        <ArticleList posts={filteredPosts} />
      )}
    </Layout>
  );
}
