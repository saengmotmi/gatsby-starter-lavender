import { useEffect, useRef } from "react";

import { useDarkMode } from "~/hooks/useDarkMode";

const src = "https://utteranc.es/client.js";
const branch = "main";

interface Props {
  repo: string;
  pathname: string;
}

const Utterances = ({ repo, pathname }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const [darkMode] = useDarkMode();
  const utteranceTheme = darkMode ? "photon-dark" : "github-light";

  useEffect(() => {
    const utterances = document.createElement("script");
    const config = {
      src,
      repo,
      branch,
      theme: utteranceTheme,
      label: "comment",
      async: "true",
      crossorigin: "anonymous",
      "issue-term": pathname,
    };

    Object.entries(config).forEach(([key, value]) => {
      utterances.setAttribute(key, value);
    });

    if (!ref.current) {
      return;
    }

    ref.current.innerHTML = "";
    ref.current.appendChild(utterances);
  }, [repo, pathname, utteranceTheme]);

  return <div className="utterances" ref={ref} />;
};

export default Utterances;
