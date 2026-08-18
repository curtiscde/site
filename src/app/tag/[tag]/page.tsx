import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import PostsWithPagination from "@/app/components/Posts";
import { config } from "@/app/config";
import { Post } from "@/app/types";
import { filterPostsByTag, getPosts, getTopTags, paginatePosts } from "@/app/util/posts";

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

  const tagPosts: Post[] = filterPostsByTag(getPosts(), tag);
  const { currentPage, pageCount, pagePosts } = paginatePosts(tagPosts, postsPerPage)

  return (
    <>
      <Header />
      <Hero tag={tag} />
      <main>
        <div className="container mx-auto">
          <PostsWithPagination postsProps={{ posts: pagePosts }} paginationProps={{ currentPage, pageCount, tag }} />
        </div>
      </main>
    </>
  );
}