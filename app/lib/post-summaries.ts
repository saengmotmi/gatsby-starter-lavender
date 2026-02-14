import rawPostSummaries from "~/generated/post-summaries.json";
import type { PostSummary } from "~/lib/post-types";

const parsedPostSummaries = (rawPostSummaries as PostSummary[])
  .filter((post) => !post.draft)
  .sort((firstPost, secondPost) => secondPost.date.localeCompare(firstPost.date));

export const allPostSummaries = parsedPostSummaries;
