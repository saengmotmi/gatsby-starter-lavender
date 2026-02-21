import { useLoaderData } from "react-router";

import ArticleList from "~/components/ArticleList";
import Profile from "~/components/Profile";
import { allPostSummaries } from "~/lib/post-summaries";
import siteConfig from "~/lib/site-config";
import Layout from "~/layout";

export function meta() {
  const title = siteConfig.title;
  const description = siteConfig.description;
  const url = siteConfig.siteUrl;
  const canonicalUrl = url.endsWith("/") ? url : `${url}/`;
  const image = `${siteConfig.siteUrl}/og/index.png`;
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
  const { posts } = useLoaderData<typeof loader>();
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
      {posts.length === 0 ? <p>No posts found.</p> : <ArticleList posts={posts} />}
    </Layout>
  );
}
