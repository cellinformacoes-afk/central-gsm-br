import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/perfil',
        '/pedidos',
        '/extrato',
        '/saldo',
      ],
    },
    sitemap: 'https://centralgsm.com.br/sitemap.xml',
  };
}
