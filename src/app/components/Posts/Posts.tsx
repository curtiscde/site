'use client'

import React, { Suspense } from "react";
import { Post } from "../../types/Post";
import dynamic from "next/dynamic";
import { PostCard } from "../PostCard";
import './Posts.scss';

export interface PostsProps {
  posts: Post[]
}

const StaticPosts = ({ posts }: PostsProps) => (
  <div className="grid grid-cols-12 gap-4 p-4 lg:p-0">
    {posts.map((post) => (
      <div key={post.slug} className="grid col-span-12 md:col-span-4">
        <PostCard data={post} />
      </div>
    ))}
  </div>
)

const DynamicMasonryPosts = dynamic(() => import('../MasonryPosts'), {
  ssr: false,
});

export default function Posts({ posts }: PostsProps) {
  return (
    <Suspense fallback={<StaticPosts posts={posts} />}>
      <DynamicMasonryPosts posts={posts} />
    </Suspense>
  )
}
