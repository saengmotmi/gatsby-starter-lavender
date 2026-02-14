import { useEffect, useState } from "react";

export const useMedia = <T>(queries: string[], values: T[], defaultValue: T): T => {
  const mediaQueryLists =
    typeof window === "undefined" ? [] : queries.map((query) => window.matchMedia(query));

  const getValue = () => {
    const index = mediaQueryLists.findIndex((queryList) => queryList.matches);
    return values[index] ?? defaultValue;
  };

  const [value, setValue] = useState<T>(getValue);

  useEffect(() => {
    const handler = () => setValue(getValue);

    mediaQueryLists.forEach((queryList) => queryList.addEventListener("change", handler));
    return () => {
      mediaQueryLists.forEach((queryList) => queryList.removeEventListener("change", handler));
    };
  }, []);

  return value;
};
