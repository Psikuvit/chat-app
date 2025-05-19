const nextConfig = {
  images: {
    domains: ['localhost', 'https://chatapp-a8f.up.railway.app/'],
  },
  env: {
    NEXT_PUBLIC_SOCKET_SERVER_URL: process.env.NEXT_PUBLIC_SOCKET_SERVER_URL,
  }
}

module.exports = nextConfig