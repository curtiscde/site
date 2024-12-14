import { getPosts } from "@/app/util/posts"
import "./PostPage.scss"
import { PostPage } from "@/app/components/PostPage";

export async function generateStaticParams() {
  const posts = await getPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
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

  return <PostPage post={post} />
}