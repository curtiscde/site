import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Retained for Jest, not for the browser. `next/jest` derives its
  // transformIgnorePatterns from this list, and marked ships ESM only, so without it
  // test suites that touch types/Post.ts cannot load it. The build itself does not
  // need this entry, and marked is no longer in any client chunk — see
  // scripts/check-client-bundle.mjs, which fails the build if that regresses.
  transpilePackages: ['marked'],
};

export default nextConfig;
