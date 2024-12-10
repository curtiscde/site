'use client'

import React from "react";
import { Post } from "../types/Post";
import { Masonry } from "masonic";
import { PostCard } from "./PostCard";

const EasyMasonryComponent = ({ posts }: { posts: Post[] }) => (
  <Masonry items={posts} render={PostCard} columnGutter={14} rowGutter={14} maxColumnCount={3} columnWidth={417} />
);

export default function Posts({ posts }: { posts: Post[] }) {
  return (
    <EasyMasonryComponent posts={posts} />
  )
}
