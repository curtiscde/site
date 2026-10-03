import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import PostsWithPagination from "@/app/components/Posts";
import { config } from "@/app/config";
import { Post } from "@/app/types";
import { RelatedTags } from "@/app/components/RelatedTags";
import { filterPostsByTag, formatTagStats, getPosts, getRelatedTags, getTopTags, paginatePosts } from "@/app/util/posts";
import { toSummary } from "@/app/types";

const { postsPerPage } = config

export async function generateStaticParams() {
  const posts = getPosts();
  const tags = getTopTags(posts);

  return tags.map(({ tag }) => ({
    tag
  }))
}

export default async function Page({ params }: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = (await params)

  const posts: Post[] = getPosts();
  const tagPosts: Post[] = filterPostsByTag(posts, tag);
  const { currentPage, pageCount, pagePosts } = paginatePosts(tagPosts, postsPerPage)

  return (
    <>
      <Header />
      <Hero tag={tag} subtitle={formatTagStats(tagPosts)} />
      <main>
        <div className="container mx-auto">
          <PostsWithPagination postsProps={{ posts: pagePosts.map(toSummary) }} paginationProps={{ currentPage, pageCount, tag }} />
        </div>
        <RelatedTags tag={tag} relatedTags={getRelatedTags(posts, tag)} />
      </main>
    </>
  );
}