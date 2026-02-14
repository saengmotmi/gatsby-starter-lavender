import { useState } from "react";

import { loadPage, savePage } from "~/utils/storage";

const initialPage = loadPage(1);

export const usePage = (): [number, (page: number) => void] => {
  const [page, setPage] = useState(initialPage);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    savePage(nextPage);
  };

  return [page, changePage];
};
