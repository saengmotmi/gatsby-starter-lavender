import { useEffect } from "react";

const getLocationKey = (location: Pick<Location, "pathname" | "search" | "hash">) =>
  `${location.pathname}${location.search}${location.hash}`;

const decodeHashId = (rawHash: string) => {
  const rawId = rawHash.slice(1);
  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

const resolveHashTarget = () => {
  const rawHash = window.location.hash;
  if (!rawHash || rawHash.length <= 1) {
    return null;
  }

  return document.getElementById(decodeHashId(rawHash));
};

const scrollToHashTarget = (retries = 6) => {
  const target = resolveHashTarget();
  if (target) {
    target.scrollIntoView({ block: "start", inline: "nearest" });
    return;
  }

  if (retries > 0) {
    requestAnimationFrame(() => {
      scrollToHashTarget(retries - 1);
    });
  }
};

export default function HashAnchorScroll() {
  useEffect(() => {
    const inPageScrollPositions = new Map<string, number>();

    const rememberCurrentPosition = () => {
      inPageScrollPositions.set(getLocationKey(window.location), window.scrollY);
    };

    const restoreAfterNavigation = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (window.location.hash) {
            scrollToHashTarget();
            return;
          }

          const savedY = inPageScrollPositions.get(getLocationKey(window.location));
          if (typeof savedY === "number") {
            window.scrollTo(0, savedY);
          }
        });
      });
    };

    const handleAnchorIntent = (event: MouseEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href?.startsWith("#")) {
        return;
      }

      rememberCurrentPosition();
    };

    rememberCurrentPosition();
    restoreAfterNavigation();

    document.addEventListener("click", handleAnchorIntent, true);
    window.addEventListener("hashchange", restoreAfterNavigation);
    window.addEventListener("popstate", restoreAfterNavigation);
    window.addEventListener("pagehide", rememberCurrentPosition);

    return () => {
      document.removeEventListener("click", handleAnchorIntent, true);
      window.removeEventListener("hashchange", restoreAfterNavigation);
      window.removeEventListener("popstate", restoreAfterNavigation);
      window.removeEventListener("pagehide", rememberCurrentPosition);
    };
  }, []);

  return null;
}
