'use client'

import { Post } from "../types";
import { useEffect, useState } from "react";
import hljs from "highlight.js";
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import 'highlight.js/styles/atom-one-dark.css';
import './PostPage.scss'
import { Header } from "./Header";
import Link from "next/link";
import { FastAverageColor } from 'fast-average-color';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);

const AdjacentPost = ({ post, imageBackgroundColor, type: adjacentPostType }: { post: Post, imageBackgroundColor: string | null, type: 'previous' | 'next' }) => {

  const AdjacentPostImage = ({ post }: { post: Post }) => {
    if (post.imageThumbnailUrl == null) {
      return null
    }

    let imageStyle = {}
    if (imageBackgroundColor != null) {
      imageStyle = {
        backgroundColor: imageBackgroundColor
      }
    }

    return (
      <figure className="w-60" style={imageStyle}>
        <img
          src={post.imageThumbnailUrl}
          alt={post.title} />
      </figure>
    )
  }

  return (
    <Link href={post.path}>
      <div className="card card-compact card-side bg-base-100 shadow-xl w-96 h-full grow">
        {adjacentPostType === 'previous' && <AdjacentPostImage post={post} />}
        <div className="card-body">
          <h4 className="card-title text-sm">Next Post</h4>
          <p>{post.title}</p>
        </div>
        {adjacentPostType === 'next' && <AdjacentPostImage post={post} />}
      </div>
    </Link>
  )
}

export const PostPage = ({ post, previousPost, nextPost }: { post: Post, previousPost?: Post | null, nextPost?: Post | null }) => {
  const [previousPostImageColor, setPreviousPostImageColor] = useState<string | null>(null);
  const [nextPostImageColor, setNextPostImageColor] = useState<string | null>(null)

  useEffect(() => {
    const fac = new FastAverageColor();

    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });

    if (previousPost?.imageThumbnailUrl != null) {
      fac.getColorAsync(previousPost.imageThumbnailUrl).then((color) => {
        setPreviousPostImageColor(color.hex);
      })
    }

    if (nextPost?.imageThumbnailUrl != null) {
      fac.getColorAsync(nextPost.imageThumbnailUrl).then((color) => {
        setNextPostImageColor(color.hex);
      })
    }
  }, [previousPost, nextPost])

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
        <div className="bg-primary-content py-12 mt-12">
          <div className="container mx-auto">
            <div className="mx-6">
              <div className="flex justify-between ajacent-posts">
                {previousPost != null &&
                  <AdjacentPost post={previousPost} type="previous" imageBackgroundColor={previousPostImageColor} />
                }
                {
                  nextPost != null &&
                  <AdjacentPost post={nextPost} type="next" imageBackgroundColor={nextPostImageColor} />
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}