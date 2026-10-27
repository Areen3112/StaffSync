import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  transpilePackages: ['lucide-react', 'gsap', 'lenis', 'motion'],
  sassOptions: {
    includePaths: [path.join(__dirname, 'src/styles')],
  },
};

export default nextConfig;
