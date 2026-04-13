'use client'

import React, { useRef, useState } from "react"
import { Post, TagCount } from "../../types"
import Link from "next/link"
import "./Footer.scss"
import { config } from "../../config"
import SocialLinks from "./SocialLinks"

export const Footer = ({ recentPosts, topTags }: { recentPosts: Post[], topTags: TagCount[] }) => {
  const tagsToDisplay = 12
  const tagsNotDisplayedCount = topTags.length - tagsToDisplay

  const dialog = useRef<HTMLDialogElement>(null)
  const [modalSort, setModalSort] = useState<'smart' | 'count'>('smart')

  const copyright = `All rights reserved © ${config.title} ${new Date().getFullYear()}`

  const modalTags = modalSort === 'count'
    ? [...topTags].sort((a, b) => b.count - a.count)
    : topTags

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
              <Link className="link link-hover" href="/privacy-policy">Privacy policy</Link>
              <button className="link link-hover text-left" onClick={() => { localStorage.removeItem('cookie-consent'); window.location.reload() }}>Cookie settings</button>
              <a href="https://buymeacoffee.com/curtiscode">☕️ Buy me a coffee</a>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Post Tags</h3>
              <div className="join">
                <button
                  className={`join-item btn btn-xs gap-1 ${modalSort === 'smart' ? 'btn-neutral' : 'btn-ghost'}`}
                  onClick={() => setModalSort('smart')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Smart
                </button>
                <button
                  className={`join-item btn btn-xs gap-1 ${modalSort === 'count' ? 'btn-neutral' : 'btn-ghost'}`}
                  onClick={() => setModalSort('count')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  Count
                </button>
              </div>
            </div>
            <div className="card-actions mt-4">
              {modalTags.map(({ tag, count }) => (
                <Link key={tag} className="link link-hover" href={`/tag/${tag}`} title={`${tag} [${count}]`} onClick={() => dialog.current?.close()}><div key={tag} className="badge badge-outline">{tag}</div></Link>
              ))}
            </div>
          </div>
        </dialog>
      </div>
    </>
  )
}
