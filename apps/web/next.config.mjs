import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@escudo/rules'],
  turbopack: { root: fileURLToPath(new URL('../../', import.meta.url)) },
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${process.env.API_URL ?? 'http://127.0.0.1:4000'}/api/v1/:path*` }];
  },
};
export default nextConfig;
