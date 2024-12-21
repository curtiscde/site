'use client'

import { Post } from "../types";
import { useEffect } from "react";
import hljs from "highlight.js";
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import 'highlight.js/styles/atom-one-dark.css';
import './PostPage.scss'
import { Header } from "./Header";
import { RelatedPosts } from "./RelatedPosts";

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);

export const PostPage = ({ post, relatedPosts }: { post: Post, relatedPosts: Post[] }) => {
  useEffect(() => {

    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });

  }, [])

  return (
    <>
      <Header />
      <main className="post-page">
        <div className="container mx-auto">
          <div className="mx-6">
            <article className="prose lg:prose-lg mx-auto pt-12">
              <span className="text-sm">{post.dateFormatted}</span>
              <h1 >{post.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              <div className="card-actions mt-12">
                {post.tags.map(tag => (
                  <a key={tag} href={`/tag/${tag}`}><div className="badge badge-secondary">{tag}</div></a>
                ))}
              </div>
            </article>
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