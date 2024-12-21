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
      <div className="bg-neutral">
        <div className="container mx-auto">
          <footer className="footer text-neutral-content p-10 grid lg:grid-cols-3">
            <nav>
              <h6 className="footer-title">Recent Posts</h6>
              {recentPosts.map((post) => (
                <Link key={post.id} className="link link-hover" href={post.path}>{post.title}</Link>
              ))}
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
            <aside className="grid-flow-col items-center mx-auto md:mx-0">
              <div className="avatar mx-2">
                <div className="w-10 rounded-full grayscale">
                  <img src="/images/curtis.jpeg" />
                </div>
              </div>
              <p>{copyright}</p>
            </aside>
            <nav className="md:place-self-center md:justify-self-end mx-auto md:mx-0">
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
                <a href={config.socialLinks.github}>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 32 32"
                    className="fill-current">
                    <path fillRule="evenodd" d="M 16 4 C 9.371094 4 4 9.371094 4 16 C 4 21.300781 7.4375 25.800781 12.207031 27.386719 C 12.808594 27.496094 13.027344 27.128906 13.027344 26.808594 C 13.027344 26.523438 13.015625 25.769531 13.011719 24.769531 C 9.671875 25.492188 8.96875 23.160156 8.96875 23.160156 C 8.421875 21.773438 7.636719 21.402344 7.636719 21.402344 C 6.546875 20.660156 7.71875 20.675781 7.71875 20.675781 C 8.921875 20.761719 9.554688 21.910156 9.554688 21.910156 C 10.625 23.746094 12.363281 23.214844 13.046875 22.910156 C 13.15625 22.132813 13.46875 21.605469 13.808594 21.304688 C 11.144531 21.003906 8.34375 19.972656 8.34375 15.375 C 8.34375 14.0625 8.8125 12.992188 9.578125 12.152344 C 9.457031 11.851563 9.042969 10.628906 9.695313 8.976563 C 9.695313 8.976563 10.703125 8.65625 12.996094 10.207031 C 13.953125 9.941406 14.980469 9.808594 16 9.804688 C 17.019531 9.808594 18.046875 9.941406 19.003906 10.207031 C 21.296875 8.65625 22.300781 8.976563 22.300781 8.976563 C 22.957031 10.628906 22.546875 11.851563 22.421875 12.152344 C 23.191406 12.992188 23.652344 14.0625 23.652344 15.375 C 23.652344 19.984375 20.847656 20.996094 18.175781 21.296875 C 18.605469 21.664063 18.988281 22.398438 18.988281 23.515625 C 18.988281 25.121094 18.976563 26.414063 18.976563 26.808594 C 18.976563 27.128906 19.191406 27.503906 19.800781 27.386719 C 24.566406 25.796875 28 21.300781 28 16 C 28 9.371094 22.628906 4 16 4 Z"></path>
                  </svg>
                </a>
                <a href={config.socialLinks.x}>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="fill-current">
                    <path d="M 2.8671875 3 L 9.7363281 12.818359 L 2.734375 21 L 5.3808594 21 L 10.919922 14.509766 L 15.460938 21 L 21.371094 21 L 14.173828 10.697266 L 20.744141 3 L 18.138672 3 L 12.996094 9.0097656 L 8.7988281 3 L 2.8671875 3 z"></path>
                  </svg>
                </a>
                <a href={config.socialLinks.rss}>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="fill-current">
                    <path d="M0 0v24h24v-24h-24zm6.168 20c-1.197 0-2.168-.969-2.168-2.165s.971-2.165 2.168-2.165 2.167.969 2.167 2.165-.97 2.165-2.167 2.165zm5.18 0c-.041-4.029-3.314-7.298-7.348-7.339v-3.207c5.814.041 10.518 4.739 10.56 10.546h-3.212zm5.441 0c-.021-7.063-5.736-12.761-12.789-12.792v-3.208c8.83.031 15.98 7.179 16 16h-3.211z" />
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