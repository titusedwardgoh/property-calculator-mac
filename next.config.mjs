/** @type {import('next').NextConfig} */
const nextConfig = {
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
