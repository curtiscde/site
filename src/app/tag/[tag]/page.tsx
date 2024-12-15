import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import Pagination from "@/app/components/Pagination";
import Posts from "@/app/components/Posts";
import { config } from "@/app/config";
import { Post } from "@/app/types";
import { filterPostsByPage, filterPostsByTag, getPosts, getTopTags } from "@/app/util/posts";

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
  const pageCount = Math.ceil(tagPosts.length / postsPerPage);
  const currentPage = Number(1)
  const pagePosts = filterPostsByPage(tagPosts, postsPerPage, currentPage)


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
              <Pagination currentPage={currentPage} pageCount={pageCount} tag={tag} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}