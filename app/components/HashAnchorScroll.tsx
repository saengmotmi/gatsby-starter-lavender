import { useEffect } from "react";
import { useLocation } from "react-router";

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
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        scrollToHashTarget();
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [hash]);

  return null;
}
