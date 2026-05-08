## AI Suite (Next.js + Tailwind + shadcn-style UI)

Minimal “AI Suite” demo with 3 tools, Stripe Payment Link redirect, and a `/success` page that calls an OpenAI-powered backend route.

## Getting Started

1) Create `ai-suite/.env.local` from the example:

```bash
copy .env.example .env.local
```

2) Fill:
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_STRIPE_LINK_*` payment link URLs

3) Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/`: main “AI Suite” page (3 tools)
- `/success?tool=...`: reads localStorage, calls `/api/generate`, shows result + copy button
- `/api/generate`: OpenAI GPT‑4o‑mini

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
