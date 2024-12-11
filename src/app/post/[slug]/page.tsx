import { getPosts } from "@/app/posts"
import Link from "next/link";
import showdown from 'showdown';
import "./PostPage.scss"

export async function generateStaticParams() {
  const posts = await getPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

function PostContent({ content }: { content: string }) {
  const convert = new showdown.Converter();
  const htmlContent = convert.makeHtml(content);
  return (
    // eslint-disable-next-line react/no-danger
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug

  const posts = await getPosts();
  const post = posts.find(post => post.slug === slug)

  if (post == null) {
    throw new Error('post not found')
  }

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

      <main className="post-page">
        <div className="container mx-auto">
          <div className="mx-6">
            <article className="prose lg:prose-lg mx-auto pt-12">
              <span className="text-sm">{post.dateFormatted}</span>
              <h1 >{post.title}</h1>
              <PostContent content={post.content} />
            </article>
          </div>


        </div>
      </main>
    </>
  )
}