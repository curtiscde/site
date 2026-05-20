'use client'

import React, { useRef, useState } from "react"
import { Post, TagCount } from "../../types"
import Link from "next/link"
import Image from "next/image"
import "./Footer.scss"
import { config } from "../../config"
import SocialLinks from "./SocialLinks"
import { Laptop, FileText, Cookie, Coffee, Map } from "lucide-react"

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
              <a className="flex items-center gap-2" href="https://ko-fi.com/curtiscode"><Coffee size={16} />Support me on Ko-fi</a>
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
