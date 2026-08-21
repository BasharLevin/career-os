import type { NextConfig } from 'next';
import { parseWebEnvironment } from '@career-os/config';

parseWebEnvironment(process.env);

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
