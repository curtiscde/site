import type { Metadata } from "next";
import "./globals.scss";
import { Footer } from "./components/Footer";
import { getPosts } from "./posts";
import { getTopTags } from "./posts";

export const metadata: Metadata = {
  title: "Curtis Timson | Software Engineer",
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
        <Footer topTags={topTags} />
      </body>
    </html>
  );
}
