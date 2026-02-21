import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import HashAnchorScroll from "~/components/HashAnchorScroll";
import siteConfig from "~/lib/site-config";
import { lightTheme } from "~/styles/theme.css";
import "~/styles/global.css";
import "~/fonts/Pretendard/pretendard.css";
import "~/prism/prism-vsc-dark-plus.css";
import "katex/dist/katex.min.css";

const GTM_CONTAINER_ID = "GTM-NGXTQ8ZS";
const GTM_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`;

export function links() {
  const rssTitle = `${siteConfig.title} RSS`;
  return [
    {
      rel: "preload",
      href: "/assets/Pretendard-Regular-BleH6oJ0.woff2",
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      href: "/assets/Pretendard-Bold-BDestNM2.woff2",
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      href: "/assets/Pretendard-Black-DSUTIcIc.woff2",
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    { rel: "icon", type: "image/png", href: "/thumbnails/main-github.png" },
    { rel: "apple-touch-icon", href: "/thumbnails/main-github.png" },
    { rel: "shortcut icon", href: "/thumbnails/main-github.png" },
    { rel: "alternate", type: "application/rss+xml", title: rssTitle, href: "/rss.xml" },
    { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {import.meta.env.PROD ? (
          <script
            dangerouslySetInnerHTML={{
              __html: GTM_SCRIPT,
            }}
          />
        ) : null}
      </head>
      <body className={lightTheme}>
        {import.meta.env.PROD ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <HashAnchorScroll />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "오류가 발생했습니다";
  let message = "예상치 못한 문제가 발생했습니다.";

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "404" : `오류 (${error.status})`;
    message = error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <main>
      <h1>{title}</h1>
      <p>{message}</p>
    </main>
  );
}
