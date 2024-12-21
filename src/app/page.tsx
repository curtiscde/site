import { Post } from "./types/Post";
import { filterPostsByPage, getPosts } from "./util/posts";
import { Hero } from "./components/Hero";
import { Header } from "./components/Header";
import { config } from "./config";
import PostsWithPagination from "./components/Posts/PostsWithPagination";

export default function Home() {
  const { postsPerPage } = config
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
          <PostsWithPagination postsProps={{ posts: pagePosts }} paginationProps={{ currentPage, pageCount }} />
        </div>
      </main>
    </>
  );
}
