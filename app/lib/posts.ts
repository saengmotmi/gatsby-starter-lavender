import rawPosts from "~/generated/posts.json";
import type { Post } from "~/lib/post-types";

const normalizePath = (value: string) => {
  if (!value.startsWith("/")) {
    return `/${value.endsWith("/") ? value : `${value}/`}`;
  }

  return value.endsWith("/") ? value : `${value}/`;
};

const parsedPosts = (rawPosts as Post[])
  .filter((post) => !post.draft)
  .sort((firstPost, secondPost) => secondPost.date.localeCompare(firstPost.date));

export const allPosts = parsedPosts;

export const findPostByPath = (path: string) => {
  const normalizedPath = normalizePath(path);
  return parsedPosts.find((post) => post.path === normalizedPath) ?? null;
};

export const getAdjacentPosts = (currentPostPath: string) => {
  const currentIndex = parsedPosts.findIndex((post) => post.path === currentPostPath);

  if (currentIndex === -1) {
    return {
      previousPost: null,
      nextPost: null,
    };
  }

  const previousCandidate = parsedPosts[currentIndex + 1] ?? null;
  const nextCandidate = parsedPosts[currentIndex - 1] ?? null;

  return {
    previousPost: previousCandidate
      ? { path: previousCandidate.path, title: previousCandidate.title }
      : null,
    nextPost: nextCandidate ? { path: nextCandidate.path, title: nextCandidate.title } : null,
  };
};
