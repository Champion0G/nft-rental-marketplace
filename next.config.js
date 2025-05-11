/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/nft-rental-marketplace',
  assetPrefix: '/nft-rental-marketplace/',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig 