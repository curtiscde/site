'use client'

import React, { useRef } from "react"
import { TagCount } from "../types"
import Link from "next/link"
import "./Footer.scss"

export const Footer = ({ topTags }: { topTags: TagCount[] }) => {
  const tagsToDisplay = 12
  const tagsNotDisplayedCount = topTags.length - tagsToDisplay

  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      <div className="bg-neutral mt-16">
        <div className="container mx-auto">
          <footer className="footer text-neutral-content p-10 grid lg:grid-cols-3">
            <nav>
              <h6 className="footer-title">Social</h6>
              <a className="link link-hover" href="https://www.linkedin.com/in/curtis-timson-89040a37/" target="_blank">LinkedIn</a>
              <a className="link link-hover" href="https://bsky.app/profile/curtiscode.dev" target="_blank">Bluesky</a>
              <a className="link link-hover" href="https://stackoverflow.com/users/370103/curtis" target="_blank">StackOverflow</a>
              <a className="link link-hover" href="https://github.com/curtiscde" target="_blank">GitHub</a>
              <a className="link link-hover" href="/rss.xml">RSS</a>
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