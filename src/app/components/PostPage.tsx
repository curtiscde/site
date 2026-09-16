'use client'

import type { Post, PostSummary } from "../types";
import { useRef } from "react";
// Stylesheet only — the markup it colours is produced at build time by the `code`
// renderer in types/Post.ts, so highlight.js itself never reaches the browser.
import 'highlight.js/styles/atom-one-dark.css';
import './PostPage.scss'
import { RelatedPosts } from "./RelatedPosts";
import { Comments } from "./Comments/Comments";
import { ArticleLightbox } from "./ArticleLightbox/ArticleLightbox";

export const PostPage = ({ post, relatedPosts }: { post: Post, relatedPosts: PostSummary[] }) => {
  // In-article images are injected HTML, not components, so the lightbox delegates
  // from this container rather than rendering anything per image.
  const article = useRef<HTMLDivElement>(null);

  return (
    <>
      <main className="post-page">
        <div className="container mx-auto">
          <div className="mx-6">
            <article className="prose lg:prose-lg mx-auto pt-12">
              <span className="text-sm">{post.dateFormatted}</span>
              <h1 >{post.title}</h1>
              <div ref={article} dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              <ArticleLightbox containerRef={article} />
              <div className="card-actions mt-12">
                {post.tags.map(tag => (
                  <a key={tag} href={`/tag/${tag}`}><div className="badge badge-secondary">{tag}</div></a>
                ))}
              </div>
            </article>
          </div>
        </div>
        <div className="container mx-auto">
          <div className="mx-6">
            <div className="prose lg:prose-lg mx-auto py-12">
              <Comments />
            </div>
          </div>
        </div>
        {relatedPosts.length > 0 && (
          <div className="bg-primary-content py-12 mt-12">
            <div className="container mx-auto">
              <div className="mx-6">
                <RelatedPosts posts={relatedPosts} />
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}