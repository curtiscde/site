import React from "react"
import { TagCount } from "../types"
import Link from "next/link"

export const Footer = ({ topTags }: { topTags: TagCount[] }) => {
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
            </nav>
            <nav>
              <h6 className="footer-title">Tags</h6>
              <div className="card-actions">
                {topTags.slice(0, 12).map(({ tag, count }) => (
                  // <Link key={tag} className="link link-hover" href={`/tag/${tag}`}>{tag}</Link>
                  <Link key={tag} className="link link-hover" href={`/tag/${tag}`} title={`${tag} [${count}]`}><div key={tag} className="badge badge-outline">{tag}</div></Link>
                ))}
              </div>
            </nav>
            <nav>
              <h6 className="footer-title">Legal</h6>
              <a className="link link-hover">Terms of use</a>
              <a className="link link-hover">Privacy policy</a>
              <a className="link link-hover">Cookie policy</a>
            </nav>
          </footer>
        </div>
      </div>
    </>
  )
}