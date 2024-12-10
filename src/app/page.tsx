'use client'

import Link from "next/link";
import "./hero.scss";
import { PostCard } from "./components/PostCard";
import { Post } from "./types/Post";
import { Masonry } from "masonic";
// import { getPosts } from "./posts";

export default function Home() {

  // const posts: Array<Post> = getPosts();



  const _posts: Post[] = [
    {
      id: 'a',
      title: 'My terminal setup and commands I use on a daily basis when working with GitHub',
      thumbnailImageUrl: '/post/daily-commands/daily-commands.png',
      description: 'A preview of some of the tools I use in my terminal setup, as well as the commands I use on a daily basis when working with GitHub',
      slug: 'foo',
      tags: ['terminal', 'github', 'warp', 'ohmyzsh'],
      date: new Date()
    },
    {
      id: 'b',
      title: 'Displaying latest posts on your GitHub profile',
      thumbnailImageUrl: '/post/github-profile-readme/cover-latest-posts-600w.png',
      description: 'GitHub now has the option of adding a README to your profile page, which can be updated with your latest blog posts',
      slug: 'bar',
      date: new Date()
    },
    {
      id: 'c',
      title: 'Using Codecov within a monorepo',
      description: 'A quick guide on how to integrate Codecov within a monorepo',
      slug: 'baz',
      date: new Date()
    },
    {
      id: 'd',
      title: 'Displaying Strava stats using webhooks & GitHub Actions',
      description: 'A recent project displaying Strava Year-To-Date stats using webhooks, Firebase, GitHub Actions & Next.js',
      slug: 'foo2',
      date: new Date()
    }
  ]

  const EasyMasonryComponent = ({ posts }: { posts: Post[] }) => (
    <Masonry items={posts} render={PostCard} columnGutter={14} rowGutter={14} maxColumnCount={3} columnWidth={417} />
  );

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
            <div className="grid col-span-12">
              <EasyMasonryComponent posts={_posts} />
            </div>
          </div>


        </div>
      </main>
    </>
  );
}
