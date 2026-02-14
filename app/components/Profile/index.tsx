import { memo, type PropsWithChildren } from "react";

import siteConfig from "~/lib/site-config";
import profileImage from "~/images/profile-pic.jpeg";

import * as styles from "./styles.css";

interface SocialLinkProps {
  username?: string;
  urlPrefix: string;
}

const ExternalLink = ({ username, urlPrefix, children }: PropsWithChildren<SocialLinkProps>) => {
  if (!username) {
    return null;
  }

  return (
    <li className={styles.linkItem}>
      <a href={`${urlPrefix}${username}`}>{children}</a>
    </li>
  );
};

interface SocialLink {
  text: string;
  url: string;
}

const Profile = () => {
  const author = siteConfig.author;
  const description = siteConfig.description;
  const social = siteConfig.social;

  const socialLinks: Record<keyof typeof social, SocialLink> = {
    github: {
      text: "GitHub",
      url: "https://github.com/",
    },
    twitter: {
      text: "Twitter",
      url: "https://twitter.com/",
    },
    facebook: {
      text: "Facebook",
      url: "https://www.facebook.com/",
    },
    instagram: {
      text: "Instagram",
      url: "https://www.instagram.com/",
    },
    linkedin: {
      text: "LinkedIn",
      url: "https://www.linkedin.com/in/",
    },
  };

  return (
    <div className={styles.container}>
      <img className="profile-image" src={profileImage} width={70} height={70} alt="Profile picture" />
      <div className={styles.wrapper}>
        <p className={styles.name}>
          <strong>{author}</strong>
        </p>

        <p className={styles.description}>{description}</p>

        <ul className={styles.externalLinks}>
          {Object.entries(social ?? {}).map(([key, username]) => {
            const serviceName = key as keyof typeof social;

            return (
              <ExternalLink
                key={serviceName}
                username={username}
                urlPrefix={socialLinks[serviceName].url}
              >
                {socialLinks[serviceName].text}
              </ExternalLink>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default memo(Profile);
