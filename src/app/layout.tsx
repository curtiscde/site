import type { Metadata } from "next";
import "./globals.scss";
import { Footer } from "./components/Footer";
import { getPosts, getTopTags } from "./util/posts";
import { config } from './config'

export const metadata: Metadata = {
  title: config.pageTitle,
  icons: '//0.gravatar.com/avatar/15a556c8b58e8aefa727088885925a12.png?s=16',
  alternates: { types: { "application/rss+xml": `${config.url}/rss.xml`, }, }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = await getPosts()
  const topTags = getTopTags(posts)

  return (
    <html lang="en" data-theme="light">
      <body>
        {children}
        <Footer recentPosts={posts.slice(0, 5)} topTags={topTags} />
      </body>
    </html>
  );
}
