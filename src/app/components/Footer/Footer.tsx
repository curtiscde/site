'use client'

import React, { useRef, useState } from "react"
import { Post, TagCount } from "../../types"
import Link from "next/link"
import Image from "next/image"
import "./Footer.scss"
import { config } from "../../config"
import SocialLinks from "./SocialLinks"
import { Laptop, FileText, Cookie, Map } from "lucide-react"

export const Footer = ({ recentPosts, topTags }: { recentPosts: Post[], topTags: TagCount[] }) => {
  const tagsToDisplay = 12
  const tagsNotDisplayedCount = topTags.length - tagsToDisplay

  const dialog = useRef<HTMLDialogElement>(null)
  const sortDropdown = useRef<HTMLDetailsElement>(null)
  const [modalSort, setModalSort] = useState<'smart' | 'count' | 'alpha'>('smart')

  const selectSort = (sort: 'smart' | 'count' | 'alpha') => {
    setModalSort(sort)
    sortDropdown.current?.removeAttribute('open')
  }

  const copyright = `All rights reserved © ${config.title} ${new Date().getFullYear()}`

  const modalTags = modalSort === 'count'
    ? [...topTags].sort((a, b) => b.count - a.count)
    : modalSort === 'alpha'
      ? [...topTags].sort((a, b) => a.tag.localeCompare(b.tag))
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
              <Link className="link link-hover flex items-center gap-2" href="/uses"><Laptop size={16} />Uses</Link>
              <Link className="link link-hover flex items-center gap-2" href="/privacy-policy"><FileText size={16} />Privacy policy</Link>
              <button className="link link-hover text-left flex items-center gap-2" onClick={() => { localStorage.removeItem('cookie-consent'); window.location.reload() }}><Cookie size={16} />Cookie settings</button>
              <a className="flex items-center gap-2" href="https://ko-fi.com/curtiscode"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M31.844 11.932c-1.032-5.448-6.48-6.125-6.48-6.125h-24.4c-0.808 0-0.907 1.063-0.907 1.063s-0.109 9.767-0.027 15.767c0.22 3.228 3.448 3.561 3.448 3.561s11.021-0.031 15.953-0.067c3.251-0.568 3.579-3.423 3.541-4.98 5.808 0.323 9.896-3.776 8.871-9.219zM17.093 16.615c-1.661 1.932-5.348 5.297-5.348 5.297s-0.161 0.161-0.417 0.031c-0.099-0.073-0.14-0.12-0.14-0.12-0.595-0.588-4.491-4.063-5.381-5.271-0.943-1.287-1.385-3.599-0.119-4.948 1.265-1.344 4.005-1.448 5.817 0.541 0 0 2.083-2.375 4.625-1.281 2.536 1.095 2.443 4.016 0.963 5.751zM25.323 17.251c-1.24 0.156-2.244 0.036-2.244 0.036v-7.573h2.359c0 0 2.631 0.735 2.631 3.516 0 2.552-1.313 3.557-2.745 4.021z" /></svg>Support me on Ko-fi</a>
              <a className="link link-hover flex items-center gap-2" href="/sitemap.xml"><Map size={16} />Sitemap.xml</a>
            </nav>
          </footer>

          <footer className="footer text-neutral-content border-base-300 border-t px-10 py-4">
            <aside className="grid-flow-col items-center mx-auto md:mx-0">
              <div className="avatar mx-2">
                <div className="w-10 rounded-full grayscale">
                  <Image src="/images/curtis.png" alt={config.title} width={40} height={40} />
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
              <details className="dropdown dropdown-end" ref={sortDropdown}>
                <summary className="btn btn-xs btn-ghost gap-1">
                  Sort: {modalSort === 'smart' ? 'Relevance' : modalSort === 'count' ? 'Count' : 'A–Z'}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <ul className="dropdown-content menu bg-base-100 rounded-box z-10 w-36 p-2 shadow text-base-content">
                  <li><a className={modalSort === 'smart' ? 'active' : ''} onClick={() => selectSort('smart')}>Relevance</a></li>
                  <li><a className={modalSort === 'count' ? 'active' : ''} onClick={() => selectSort('count')}>Count</a></li>
                  <li><a className={modalSort === 'alpha' ? 'active' : ''} onClick={() => selectSort('alpha')}>A–Z</a></li>
                </ul>
              </details>
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
