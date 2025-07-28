/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure static file serving
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Configure API routes for large file uploads
  experimental: {
    // Increase body size limit for file uploads
    isrMemoryCacheSize: 0, // Disable ISR memory cache to save memory for large uploads
  },
};

module.exports = nextConfig;
