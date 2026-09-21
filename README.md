# Muebleria 3R

Production website for **Muebleria 3R**.

## Business

- Custom Cabinetry & Furniture
- Bathroom Remodeling
- General Construction & Remodeling
- Service area: Los Angeles and surrounding communities within approximately 80 miles
- Phone: 909-437-3796
- Email: franro1988@gmail.com
- Domain: https://muebleria3r.com

## Site features

- English-first site with full EN / ES language switcher
- Responsive project gallery using real client work
- Project walkthrough video gallery
- Social links for Instagram and Facebook
- Click-to-call actions
- Real estimate/contact form
- Accessible navigation and modal galleries
- SEO metadata, structured data, robots.txt, and sitemap.xml
- Vercel production configuration

## Contact form

The form submits to `/api/contact` and uses Resend to deliver leads to Francisco.

Required Vercel environment variable:

```
RESEND_API_KEY=re_...
```

Optional overrides:

```
CONTACT_TO_EMAIL=franro1988@gmail.com
RESEND_FROM_EMAIL=Muebleria 3R <website@muebleria3r.com>
```

Before using `website@muebleria3r.com` as the sender, verify `muebleria3r.com` with Resend.

## Media

Original project media lives under:

```
assets/media/images/
assets/media/videos/
```

The site intentionally preserves the source files and references them directly from the gallery/video data in `script.js`.
