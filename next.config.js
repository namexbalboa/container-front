/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Ignorar erros de lint durante build para produção
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Ignorar erros de TypeScript durante build (corrigir depois)
        ignoreBuildErrors: true,
    },
    // Cloudflare Pages configuration
    images: {
        unoptimized: true, // Cloudflare Pages requer imagens não otimizadas ou usa Cloudflare Images
    },
};

module.exports = nextConfig;