/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/student',
        destination: '/',
      },
      {
        source: '/staff',
        destination: '/',
      },
      {
        source: '/officer',
        destination: '/',
      },
      {
        source: '/director',
        destination: '/',
      },
      {
        source: '/admin',
        destination: '/',
      },
    ]
  },
}

export default nextConfig
