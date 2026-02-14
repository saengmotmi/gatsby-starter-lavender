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
import { lightTheme } from "~/styles/theme.css";
import "~/styles/global.css";
import "~/fonts/Pretendard/pretendard.css";
import "~/prism/prism-vsc-dark-plus.css";
import "katex/dist/katex.min.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={lightTheme}>
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
