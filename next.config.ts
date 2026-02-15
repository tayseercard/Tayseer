import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'djcotaizasnukiebjtjj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin/store/:path*',
        destination: '/admin/stores/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
