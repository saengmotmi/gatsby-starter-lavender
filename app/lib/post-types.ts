export type PostType = "article" | "fleeting";

export type Post = {
  id: string;
  path: string;
  type: PostType;
  category: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  tags: string[];
  thumbnail: string;
  draft: boolean;
  html: string;
  tableOfContents: string;
};

export type PostSummary = Omit<Post, "html" | "tableOfContents">;
