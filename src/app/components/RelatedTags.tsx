import Link from "next/link";
import type { RelatedTag } from "../util/posts";
import { displayTag } from "../util/tags";

const pluralPosts = (count: number) => `${count} ${count === 1 ? 'post' : 'posts'}`

/** The tag page's closing band, styled after the post page's Continue Reading section. */
export const RelatedTags = ({ tag, relatedTags }: { tag: string, relatedTags: RelatedTag[] }) => {
  if (relatedTags.length === 0) return null

  return (
    <nav aria-label="Related tags" className="bg-primary-content py-12">
      <div className="container mx-auto">
        <div className="mx-6">
          <h2 className="mb-12 text-3xl font-extrabold leading-none tracking-tight light:text-gray-900 md:text-5xl lg:text-6xl text-center">Related Tags</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedTags.map(({ tag: relatedTag, sharedCount, postCount }) => (
              <Link key={relatedTag} href={`/tag/${relatedTag}`} className="group">
                <div className="card bg-base-100 shadow-xl h-full">
                  <div className="card-body items-center text-center">
                    <h3 className="card-title text-3xl group-hover:text-primary">{displayTag(relatedTag)}</h3>
                    <p className="opacity-70">{pluralPosts(postCount)}</p>
                    <div className="badge badge-secondary">{sharedCount} shared with {displayTag(tag)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/tags" className="link link-hover">Explore all tags →</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
