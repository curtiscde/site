import React from "react"
import { Post } from "../types/Post"

export const PostCard = ({ data: post }: { index: number, data: Post, width: number }) => {

  return (
    <div className="card bg-base-100 w-97 shadow-xl">
      {post.imageUrl != null &&
        <figure>
          <img
            src={post.imageUrl}
            alt={post.title} />
        </figure>
      }
      <div className="card-body">
        <h2 className="card-title">
          {post.title}
          <div className="badge badge-secondary">NEW</div>
        </h2>
        <p>{post.description}</p>
        <div className="card-actions justify-end">
          <div className="badge badge-outline">Fashion</div>
          <div className="badge badge-outline">Products</div>
        </div>
      </div>

    </div>

  )
}