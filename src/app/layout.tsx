import type { Metadata } from "next";
import "./globals.scss";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "Curtis Timson | Software Engineer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
