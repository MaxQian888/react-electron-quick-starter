import createNextIntlPlugin from "next-intl/plugin"
import type { NextConfig } from "next"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

// Static export so Electron can load `out/index.html` over file:// in production.
// Kept enabled for the web build path too (deployable to any static host).
const nextConfig: NextConfig = {
  output: "export",
  // Required to use the Next.js Image component in SSG mode.
  // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
