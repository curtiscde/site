import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import Pagination from "@/app/components/Pagination";
import Posts from "@/app/components/Posts";
import { config } from "@/app/config";
import { Post } from "@/app/types";
import { filterPostsByPage, filterPostsByTag, getPages, getPosts, getTopTags } from "@/app/util/posts";

const { postsPerPage } = config

interface TagPage {
  tag: string
  page: string
}

export async function generateStaticParams() {
  const posts: Array<Post> = getPosts();
  const tags = getTopTags(posts);

  const tagPages: TagPage[] = []

  tags.forEach(({ tag }) => {
    const tagPosts = filterPostsByTag(posts, tag);
    const pageCount = Math.ceil(tagPosts.length / config.postsPerPage);
    const pages = getPages({ pageCount, excludeFirstPage: true });

    pages.forEach((page) => {
      tagPages.push({
        tag: tag,
        page: page.toString(),
      },
      );
    });
  });

  if (tagPages.length === 0) {
    // Hack required until Next.js doesn't error when there are no items in the array
    // https://github.com/vercel/next.js/issues/61213
    tagPages.push({
      tag: 'css',
      page: '1000',
    })
  }

  return tagPages
}

export default async function Page({ params }: {
  params: Promise<TagPage>
}) {
  const { tag, page } = (await params)

  const tagPosts: Post[] = filterPostsByTag(getPosts(), tag);
  const pageCount = Math.ceil(tagPosts.length / postsPerPage);
  const currentPage = Number(page)
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