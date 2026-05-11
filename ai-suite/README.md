## isendai (Next.js + Tailwind)

Production-ready AI tools suite with:
- Guest + member flows
- Credits (1 request = 1 credit)
- Request history + saved versions
- Multiple AI providers (OpenAI/Anthropic/Groq/DeepSeek/Google)

Stripe subscription/checkout wiring is planned but may be deferred until the Stripe account is ready.

## Getting Started

1) Create `ai-suite/.env.local` from the example:

```bash
copy .env.example .env.local
```

2) Fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- AI provider keys you want to use (at minimum: `OPENAI_API_KEY`)

3) Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/`: main page
- `/login`: email magic link
- `/claim`: link guest data to your account (on this device)
- `/history`: guest or member history (depending on login)
- `/account`: account + credits + recent requests
- `/request/[id]`: request detail + saved versions
- `/api/generate`: charges 1 credit, generates v1, stores history
- `/api/isendai/request/version`: generates next version for the same request
- `/api/dev/topup` (dev only): add credits for testing

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
