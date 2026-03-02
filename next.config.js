/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse requires Node.js APIs (fs, path) - exclude from browser bundle
  serverExternalPackages: ['pdf-parse'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
