const nextConfig = {
  images: {
    domains: ['localhost', 'your-railway-app-url.com'],
  },
  env: {
    NEXT_PUBLIC_SOCKET_SERVER_URL: process.env.NEXT_PUBLIC_SOCKET_SERVER_URL,
  }
}

module.exports = nextConfig