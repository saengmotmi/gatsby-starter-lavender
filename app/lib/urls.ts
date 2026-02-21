import siteConfig from "~/lib/site-config";

export function toAbsoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, siteConfig.siteUrl).toString();
}

export function toOgImageUrl(imagePath: string) {
  const url = new URL(imagePath, siteConfig.siteUrl);
  const version = siteConfig.ogImageVersion?.trim();

  if (version && url.pathname.startsWith("/og/")) {
    url.searchParams.set("v", version);
  }

  return url.toString();
}
