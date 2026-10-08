# Panta Academy — Academia (projeto fictício)

> **Aviso:** site 100% fictício criado para portfólio. Nome, endereço
> (Av. dos Ipês Fictícios, 000 — Porto Fictício/EX), telefone
> `(00) 90000-0005`, WhatsApp, preços e mapas são inventados.
> Nenhum dado é real e não representa nenhuma empresa.

🌐 **Demo no ar:** https://panta-academy.vercel.app

Landing page de uma academia de musculação fictícia com visual imersivo:
hero com halter 3D (Three.js), modalidades, planos, FAQ e aula experimental
via WhatsApp.

## Stack

- HTML + CSS + JS puros, Three.js (CDN + `three.module.min.js` local)
- Animações: GSAP + ScrollTrigger, Lenis smooth scroll
- SEO: meta tags, Open Graph

## Estrutura

| Arquivo               | O quê              |
| --------------------- | ------------------ |
| `index.html`          | Página completa    |
| `styles.css`          | Estilos            |
| `app.js`              | Interações + cena 3D |
| `logo.png`, `onca.png`, `fachada.jpg` | Mídias |

## Rodar local

```bash
npx serve .
```

> `package.json` existe só para metadados; não há build.

## Deploy

Hospedado na Vercel. Push na branch principal = redeploy.
