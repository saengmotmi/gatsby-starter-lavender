import { useState } from "react";

import { loadPage, savePage } from "~/utils/storage";

export const usePage = (): [number, (page: number) => void] => {
  // Read from sessionStorage on each mount so history back/forward can restore
  // the list length before ScrollRestoration applies the saved scroll position.
  const [page, setPage] = useState(() => loadPage(1));

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    savePage(nextPage);
  };

  return [page, changePage];
};
