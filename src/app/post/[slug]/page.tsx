import { findPostBySlug, getPosts, getRelatedPosts, padRelatedPosts } from "@/app/util/posts"
import "./PostPage.scss"
import { Header } from "@/app/components/Header";
import { PostPage } from "@/app/components/PostPage";
import { Metadata, ResolvingMetadata } from "next";
import { config } from "@/app/config";
import { toSummary } from "@/app/types";

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = (await params).slug

  const posts = await getPosts();
  const post = findPostBySlug(posts, slug)

  if (post == null) {
    throw new Error('post not found')
  }

  const { title: siteName, pageTitle, url } = config
  const { title, description, tags, imageThumbnailUrl, date, author } = post
  const parentOpenGraph = (await parent).openGraph

  const postUrl = `${url}/post/${slug}`
  const imageUrl = imageThumbnailUrl ? `${url}${imageThumbnailUrl}` : undefined

  const metaData: Metadata = {
    title: `${title} | ${pageTitle}`,
    description,
    alternates: {
      canonical: postUrl,
    },
    authors: author ? [{ name: author }] : undefined,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@curtcode',
      ...(imageUrl && {
        images: [imageUrl],
      }),
    },
    openGraph: {
      ...parentOpenGraph,
      title,
      description,
      type: 'article',
      url: postUrl,
      siteName,
      publishedTime: date.toString(),
      authors: author ? [author] : undefined,
      tags,
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
            type: 'image/png',
          },
        ],
      }),
    },
  }

  return metaData
}

export async function generateStaticParams() {
  const posts = await getPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function Page({ params }: Props) {
  const slug = (await params).slug

  const posts = await getPosts();
  const post = findPostBySlug(posts, slug)

  if (post == null) {
    throw new Error('post not found')
  }

  const relatedPosts = padRelatedPosts(getRelatedPosts(posts, post), posts, post)

  // Header renders here rather than inside PostPage, which is a client component:
  // keeping site chrome at the page level is what every other route already does, and it
  // is what lets Header read the build-time image manifest.
  return (
    <>
      <Header />
      <PostPage post={post} relatedPosts={relatedPosts.map(toSummary)} />
    </>
  )
}