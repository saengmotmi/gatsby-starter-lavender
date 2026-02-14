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
  thumbnail: string;
  draft: boolean;
  html: string;
  tableOfContents: string;
};
