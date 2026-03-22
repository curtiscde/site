import type { Metadata } from "next";
import "./globals.scss";
import { Footer } from "./components/Footer/Footer";
import { getPosts, getTopTags } from "./util/posts";
import { config } from './config'
import { ThemeProvider } from "./context/ThemeContext";
import ClientThemeWrapper from "./context/ClientThemeWrapper";
import { ConsentProvider } from "./context/ConsentContext";
import { CookieBanner } from "./components/CookieBanner/CookieBanner";
import { GoogleAnalytics } from "./components/Analytics/GoogleAnalytics";
import { AdsenseScript } from "./components/Ads/AdsenseUnit";

export const metadata: Metadata = {
  title: config.pageTitle,
  icons: '//0.gravatar.com/avatar/15a556c8b58e8aefa727088885925a12.png?s=16',
  alternates: { types: { "application/rss+xml": `${config.url}/rss.xml`, }, },
  openGraph: {
    title: config.pageTitle,
    siteName: config.title,
    url: config.url,
    type: 'website',
    images: [
      {
        url: `${config.url}/images/curtis-homepage.jpg`,
        width: 1200,
        height: 630,
        alt: 'Curtis Timson',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.pageTitle,
    images: [`${config.url}/images/curtis-homepage.jpg`],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = await getPosts()
  const topTags = getTopTags(posts)

  return (
    <html lang="en">
      <body>
        <ConsentProvider>
          <ThemeProvider>
            <ClientThemeWrapper>
              {children}
              <Footer recentPosts={posts.slice(0, 5)} topTags={topTags} />
            </ClientThemeWrapper>
          </ThemeProvider>
          <CookieBanner />
          <GoogleAnalytics />
          <AdsenseScript />
        </ConsentProvider>
      </body>
    </html>
  );
}
