'use client'

import React from "react";
import { Post } from "../types/Post";
import dynamic from "next/dynamic";

const DynamicMasonryPosts = dynamic(() => import('./MasonryPosts'), { ssr: false });


export default function Posts({ posts }: { posts: Post[] }) {
  return (
    <DynamicMasonryPosts posts={posts} />
  )
}
