import type { Metadata } from "next";
import "./globals.scss";

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
      </body>
    </html>
  );
}
