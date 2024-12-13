import Link from "next/link";
import "./hero.scss";
import Posts from "./components/Posts";
import { Post } from "./types/Post";
import { filterPostsByPage, getPages, getPosts } from "./posts";

export default function Home() {
  const postsPerPage = 20
  const posts: Array<Post> = getPosts();
  const pageCount = Math.ceil(posts.length / postsPerPage);
  const pages = getPages({ pageCount })
  const currentPage = 1
  const pagePosts = filterPostsByPage(posts, postsPerPage, currentPage)

  return (
    <>
      <div className="navbar bg-base-100">
        <div className="avatar mx-2">
          <div className="w-10 rounded-full">
            <img src="/images/curtis.jpeg" />
          </div>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">Curtis Timson</Link>
      </div>

      <div
        className="hero"
        style={{
          background: 'no-repeat fixed 50% 100% / cover',
          backgroundImage: "url(/images/cover.jpg)",

        }}>
        <div className="hero-overlay bg-opacity-10"></div>
        <div className="hero-content text-neutral-content text-center py-20 text-white">
          <div className="max-w-md hero-text-container">
            <h1 className="mb-5 text-4xl font-bold">Curtis Timson</h1>
            <p className="mb-5 text-l description">
              software engineer
            </p>
          </div>
        </div>
      </div>

      <main>
        <div className="container mx-auto">
          <div className="grid grid-cols-12 gap-4 p-4 lg:p-0">
            <div className="grid col-span-12 posts">
              <Posts posts={pagePosts} />
            </div>
            <div className="grid col-span-12">
              <div className="join py-8 mx-auto">
                {pages.map((page) => (
                  <button key={page} className={`join-item btn btn-lg${page === currentPage ? ' btn-active' : ''}`}>{page}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
