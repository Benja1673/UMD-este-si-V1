/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para permitir librerías de servidor en Vercel (PDFs)
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
  
  // Si en el futuro necesitas agregar dominios de imágenes externas, irían aquí:
  /*
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
  */
};

export default nextConfig;