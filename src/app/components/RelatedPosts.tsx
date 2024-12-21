import { Post } from "../types";
import { PostCard } from "./PostCard";

export const RelatedPosts = ({ posts }: { posts: Post[] }) => {
  return (
    <>
      <h2 className="mb-12 text-3xl font-extrabold leading-none tracking-tight light:text-gray-900 md:text-5xl lg:text-6xl text-center">Continue Reading</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id}>
            <PostCard data={post} />
          </div>
        ))}
      </div>
    </>
  )
}