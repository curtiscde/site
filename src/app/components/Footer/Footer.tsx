'use client'

import React, { useRef } from "react"
import { Post, TagCount } from "../../types"
import Link from "next/link"
import "./Footer.scss"
import { config } from "../../config"
import SocialLinks from "./SocialLinks"

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
                  <img src="/images/curtis.jpeg" alt={config.title} />
                </div>
              </div>
              <p>{copyright}</p>
            </aside>
            <nav className="md:place-self-center md:justify-self-end mx-auto md:mx-0">
              <SocialLinks />
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