import { getPosts } from "@/app/posts"
import Link from "next/link";
import showdown from 'showdown';

function PostContent({ content }: { content: string }) {
  const convert = new showdown.Converter();
  const htmlContent = convert.makeHtml(content);
  return (
    // eslint-disable-next-line react/no-danger
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}

export default async function Page({
  params,
}: {
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

      <main>
        <div className="container mx-auto">
          {/* <div className="grid grid-cols-12 gap-4 p-4 lg:p-0">
            <div className="grid col-span-12"> */}
          <article className="prose lg:prose-xl mx-auto">
            <span>{post.date.toString()}</span>
            <h1 className="">{post.title}</h1>
            <PostContent content={post.content} />
          </article>
          {/* </div>
          </div> */}


        </div>
      </main>
    </>
  )
}