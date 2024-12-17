'use client'

import React, { useRef } from "react"
import { Post, TagCount } from "../types"
import Link from "next/link"
import "./Footer.scss"
import { config } from "../config"

export const Footer = ({ recentPosts, topTags }: { recentPosts: Post[], topTags: TagCount[] }) => {
  const tagsToDisplay = 12
  const tagsNotDisplayedCount = topTags.length - tagsToDisplay

  const dialog = useRef<HTMLDialogElement>(null)

  const copyright = `All rights reserved © ${config.title} ${new Date().getFullYear()}`

  return (
    <>
      <div className="bg-neutral mt-16">
        <div className="container mx-auto">
          <footer className="footer text-neutral-content p-10 grid lg:grid-cols-3">
            <nav>
              <h6 className="footer-title">Recent Posts</h6>
              {recentPosts.map((post) => (
                <Link key={post.id} className="link link-hover" href={post.path}>{post.title}</Link>
              ))}

              {/* <a className="link link-hover" href="https://bsky.app/profile/curtiscode.dev" target="_blank">Bluesky</a>
              <a className="link link-hover" href="https://stackoverflow.com/users/370103/curtis" target="_blank">StackOverflow</a>
              <a className="link link-hover" href="https://github.com/curtiscde" target="_blank">GitHub</a>
              <a className="link link-hover" href="/rss.xml">RSS</a> */}
            </nav>
            <nav>
              <h6 className="footer-title">Tags</h6>
              <div className="card-actions">
                {topTags.slice(0, tagsToDisplay).map(({ tag, count }) => (
                  <Link key={tag} className="link link-hover" href={`/tag/${tag}`} title={`${tag} [${count}]`}><div key={tag} className="badge badge-outline">{tag}</div></Link>
                ))}
                <div className="badge badge-outline tags-more" onClick={() => dialog.current?.showModal()}>+ {tagsNotDisplayedCount} more</div>
              </div>
            </nav>
            <nav>
              <h6 className="footer-title">General</h6>
              {/* <a className="link link-hover">Terms of use</a>
              <a className="link link-hover">Privacy policy</a>
              <a className="link link-hover">Cookie policy</a> */}
              <a className="link link-hover" href="/sitemap.xml">Sitemap.xml</a>
            </nav>
          </footer>

          <footer className="footer text-neutral-content border-base-300 border-t px-10 py-4">
            <aside className="grid-flow-col items-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fillRule="evenodd"
                clipRule="evenodd"
                className="fill-current">
                <path
                  d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z"></path>
              </svg>
              <p>{copyright}</p>
            </aside>
            <nav className="md:place-self-center md:justify-self-end">
              <div className="grid grid-flow-col gap-4">
                <a href={config.socialLinks.bluesky}>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="fill-current">
                    <path d="M5.769,3.618C8.291,5.512,11.004,9.352,12,11.412c0.996-2.06,3.709-5.9,6.231-7.793C20.051,2.252,23,1.195,23,4.559	c0,0.672-0.385,5.644-0.611,6.451c-0.785,2.806-3.647,3.522-6.192,3.089c4.449,0.757,5.581,3.265,3.137,5.774	c-4.643,4.764-6.672-1.195-7.193-2.722c-0.095-0.28-0.14-0.411-0.14-0.3c-0.001-0.112-0.045,0.019-0.14,0.3	c-0.521,1.527-2.55,7.486-7.193,2.722c-2.445-2.509-1.313-5.017,3.137-5.774c-2.546,0.433-5.407-0.282-6.192-3.089	C1.385,10.203,1,5.231,1,4.559C1,1.195,3.949,2.252,5.769,3.618L5.769,3.618z"></path>
                  </svg>
                </a>
                <a href={config.socialLinks.stackoverflow}>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 32 32"
                    className="fill-current">
                    <path d="M 19.59375 2.84375 L 17.96875 3.96875 L 23.5625 12.1875 L 25.1875 11.0625 Z M 15.375 6.53125 L 14.0625 8.03125 L 21.5625 14.53125 L 22.875 13.03125 Z M 12.375 10.90625 L 11.46875 12.6875 L 20.3125 17.1875 L 21.21875 15.40625 Z M 10.65625 15.4375 L 10.21875 17.375 L 19.875 19.65625 L 20.3125 17.71875 Z M 6 18 L 6 29 L 24 29 L 24 18 L 22 18 L 22 27 L 8 27 L 8 18 Z M 10.09375 19.6875 L 9.96875 21.6875 L 19.875 22.25 L 20 20.25 Z M 10 23 L 10 25 L 19.9375 25 L 19.9375 23 Z"></path>
                  </svg>

                </a>
              </div>
            </nav>
          </footer>
        </div>
        <dialog className="modal" ref={dialog}>
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => dialog.current?.close()}>✕</button>
            </form>
            <h3 className="font-bold text-lg">Post Tags</h3>
            <div className="card-actions mt-4">
              {topTags.map(({ tag, count }) => (
                <Link key={tag} className="link link-hover" href={`/tag/${tag}`} title={`${tag} [${count}]`} onClick={() => dialog.current?.close()}><div key={tag} className="badge badge-outline">{tag}</div></Link>
              ))}
            </div>
          </div>
        </dialog>
      </div>
    </>
  )
}