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

  // Configure webpack for PDF.js compatibility
  webpack: (config, { isServer }) => {
    // Ignore canvas module for client-side builds (PDF.js compatibility)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }

    // Handle PDF.js worker
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist/build/pdf.worker.js": "pdfjs-dist/build/pdf.worker.min.js",
    };

    return config;
  },

  // Configure external packages
  serverExternalPackages: ["canvas"],
};

module.exports = nextConfig;
