/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle react-pdf in server-side rendering
      config.externals = [...(config.externals || []), 'canvas', 'utf-8-validate'];
    }
    return config;
  },
};

export default nextConfig;
