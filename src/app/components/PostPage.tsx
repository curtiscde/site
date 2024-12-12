'use client'

import Link from "next/link";
import { Post } from "../types";
import { useEffect } from "react";
import hljs from "highlight.js";
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/atom-one-dark.css';
import './PostPage.scss'

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);

export const PostPage = ({ post }: { post: Post }) => {
  useEffect(() => {

    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });

  }, [])

  return (
    <>
      <div className="navbar bg-base-100">
        <div className="avatar mx-2">
          <div className="w-10 rounded-full">
            <img src="/images/curtis.jpeg" />
          </div>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">Curtis Timson</Link>
      </div>

      <main className="post-page">
        <div className="container mx-auto">
          <div className="mx-6">
            <article className="prose lg:prose-lg mx-auto pt-12">
              <span className="text-sm">{post.dateFormatted}</span>
              <h1 >{post.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              <div className="card-actions">
                {post.tags.map(tag => (
                  <a key={tag} href={`/tag/${tag}`}><div className="badge badge-secondary">{tag}</div></a>
                ))}
              </div>
            </article>
          </div>


        </div>
      </main>
    </>
  )
}