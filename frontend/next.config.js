/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle (.next/standalone) so the Docker runtime
  // image can run `node server.js` without installing node_modules.
  output: 'standalone',
  images: {
    // `images.domains` was removed in Next 16; use remotePatterns. Product/avatar
    // images come from several hosts (Cloudinary, Unsplash seed data, and the
    // backend's /uploads fallback whose host varies by deploy — localhost in dev,
    // the Railway domain in prod). We allow any https host plus local dev so
    // next/image never crashes on an unconfigured host; src values are generated
    // server-side, not free-form user input.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
};

module.exports = nextConfig;
