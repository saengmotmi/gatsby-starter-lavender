import rawSiteConfig from "../../site.config.json";

export type SiteConfig = {
  title: string;
  author: string;
  description: string;
  siteUrl: string;
  ogImageVersion?: string;
  thumbnail: string;
  social: {
    github: string;
    twitter: string;
    facebook: string;
    linkedin: string;
    instagram: string;
  };
  comment: {
    utterances: string;
    disqusShortName: string;
  };
};

const siteConfig = rawSiteConfig as SiteConfig;

export default siteConfig;
