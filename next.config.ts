import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, './'),
  env: {
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '',
    PUBLIC_ADMIN_EMAIL: process.env.PUBLIC_ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
    PUBLIC_ADMIN_PASSWORD: process.env.PUBLIC_ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '',
    NEXT_PUBLIC_ADMIN_EMAIL: process.env.PUBLIC_ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
    NEXT_PUBLIC_ADMIN_PASSWORD: process.env.PUBLIC_ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '',
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avcpjepiultssrghaodd.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
