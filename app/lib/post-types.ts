export type Post = {
  id: string;
  path: string;
  category: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  tags: string[];
  ogImage: string;
  thumbnail: string;
  draft: boolean;
  html: string;
  tableOfContents: string;
};

export type PostSummary = Omit<Post, "html" | "tableOfContents">;
