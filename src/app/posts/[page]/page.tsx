import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import PostsWithPagination from "@/app/components/Posts";
import { config } from "@/app/config";
import { Post } from "@/app/types";
import { filterPostsByPage, getPages, getPosts } from "@/app/util/posts";

export async function generateStaticParams() {
  const posts = getPosts();
  const pageCount = Math.ceil(posts.length / config.postsPerPage);
  const pages = getPages({ pageCount, excludeFirstPage: true });

  return pages.map((page) => ({
    page: page.toString(),
  }))
}

export default async function Page({ params }: {
  params: Promise<{ page: string }>
}) {
  const { page } = (await params)

  const postsPerPage = config.postsPerPage
  const posts: Post[] = getPosts();
  const pageCount = Math.ceil(posts.length / postsPerPage);
  const currentPage = Number(page)
  const pagePosts = filterPostsByPage(posts, postsPerPage, currentPage)

  return (
    <>
      <Header />
      <Hero />
      <main>
        <div className="container mx-auto">
          <PostsWithPagination postsProps={{ posts: pagePosts }} paginationProps={{ currentPage, pageCount }} />
        </div>
      </main>
    </>
  );
}