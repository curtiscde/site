import React from "react"
import { Post } from "../types/Post"

export const PostCard = ({ post }: { post: Post }) => {

  return (
    <div className="card bg-base-100 w-97 shadow-xl">

      <figure>
        <img
          src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
          alt="Shoes" />
      </figure>
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