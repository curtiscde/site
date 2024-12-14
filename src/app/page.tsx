import "./hero.scss";
import Posts from "./components/Posts";
import { Post } from "./types/Post";
import { filterPostsByPage, getPosts } from "./util/posts";
import Pagination from "./components/Pagination";
import { Hero } from "./components/Hero";
import { Header } from "./components/Header";

export default function Home() {
  const postsPerPage = 20
  const posts: Array<Post> = getPosts();
  const pageCount = Math.ceil(posts.length / postsPerPage);
  const currentPage = 1
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
