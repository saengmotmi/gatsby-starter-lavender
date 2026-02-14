import { memo } from "react";

import * as styles from "./styles.css";

interface Props {
  tags?: string[];
}

const Tags = ({ tags }: Props) => (
  <ul className={styles.tagList}>
    {tags?.map((item) => (
      <li className={styles.tag} key={item}>
        {item}
      </li>
    ))}
  </ul>
);

export default memo(Tags);
