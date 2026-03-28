'use client'

import { useContext } from "react";
import Giscus from "@giscus/react";
import { ThemeContext } from "../../context/ThemeContext";
import { useConsent } from "../../context/ConsentContext";
import { config } from "../../config";

export const Comments = () => {
  const { consent } = useConsent();
  const { theme } = useContext(ThemeContext);

  if (consent !== 'granted') {
    return (
      <p className="text-sm text-center opacity-60">
        Accept cookies to load comments.
      </p>
    );
  }

  return (
    <Giscus
      repo={config.giscus.repo}
      repoId={config.giscus.repoId}
      category={config.giscus.category}
      categoryId={config.giscus.categoryId}
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme={theme === 'dark' ? 'dark' : 'light'}
      lang="en"
    />
  );
}
