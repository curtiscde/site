import React from "react"
import { Post } from "../types/Post"
import "./postcard.scss"

export const PostCard = ({ data: post }: { index: number, data: Post, width: number }) => {
  const today = new Date();
  const oneMonthAgo = new Date(today.setMonth(today.getMonth() - 1));
  const isNew = post.date >= oneMonthAgo

  return (
    <a href={`/post/${post.slug}`} className="group">
      <div className="card bg-base-100 w-97 shadow-xl post-card">

        {post.imageThumbnailUrl != null &&
          <figure className="bg-primary">
            <img
              src={post.imageThumbnailUrl}
              alt={post.title} />
          </figure>
        }
        <div className="card-body">
          <span className="text-xs text-neutral">{post.dateFormatted}</span>
          <h2 className="card-title group-hover:text-primary">
            {post.title}
            {isNew && <div className="badge badge-secondary">NEW</div>}
          </h2>
          <p>{post.description}</p>
          {post.tags != null && (
            <div className="card-actions justify-end">
              {post.tags.map(tag => (
                <div key={tag} className="badge badge-outline">{tag}</div>
              ))}
            </div>
          )}
        </div>

      </div>
    </a>
  )
}