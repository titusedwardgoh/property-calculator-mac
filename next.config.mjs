/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force blocking (non-streaming) metadata for crawlers that may parse
  // early HTML before <head> tags arrive. Custom values replace Next.js'
  // default list, so keep the built-in bot UAs and add Googlebot explicitly.
  htmlLimitedBots:
    /Googlebot|Google-InspectionTool|Bingbot|Yandex|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i,
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle react-pdf in server-side rendering
      config.externals = [...(config.externals || []), 'canvas', 'utf-8-validate'];
    }
    return config;
  },
};

export default nextConfig;
