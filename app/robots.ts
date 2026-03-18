import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/perfil', '/pedidos/'], // Don't index private pages
    },
    sitemap: 'https://central-gsm.vercel.app/sitemap.xml',
  };
}
