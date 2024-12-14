import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import Pagination from "@/app/components/Pagination";
import Posts from "@/app/components/Posts";
import { config } from "@/app/config";
import { Post } from "@/app/types";
import { filterPostsByPage, getPages, getPosts } from "@/app/util/posts";

export async function generateStaticParams() {
  const posts = getPosts();
  const pageCount = Math.ceil(posts.length / config.postsPerPage);
  const pages = getPages({ pageCount, excludeFirstPage: true });

  console.log('pages', pages)

  return pages.map((page) => ({
    page: page.toString(),
  }))
}

export default async function Page({ params }: {
  params: Promise<{ page: string }>
}) {
  const { page } = (await params)

  const postsPerPage = 20
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
          <div className="grid grid-cols-12 gap-4 p-4 lg:p-0">
            <div className="grid col-span-12 posts">
              <Posts posts={pagePosts} />
            </div>
            <div className="grid col-span-12">
              <Pagination currentPage={currentPage} pageCount={pageCount} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}