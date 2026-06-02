export type Locale = "en" | "es" | "fr" | "de" | "zh" | "tr";

export const LOCALES: { locale: Locale; label: string }[] = [
  { locale: "en", label: "English" },
  { locale: "es", label: "Español" },
  { locale: "fr", label: "Français" },
  { locale: "de", label: "Deutsch" },
  { locale: "zh", label: "中文" },
  { locale: "tr", label: "Türkçe" },
];

type Dict = Record<string, string>;

export const DICTS: Record<Locale, Dict> = {
  en: {
    "brand.name": "isendai",
    "header.theme": "Toggle theme",
    "socialProof.demoPrefix": "Demo vibe:",
    "hero.kicker": "Your chaotic draft → send-ready masterpiece ✨",
    "hero.title": "Don't Send That Yet. Fix It First.",
    "hero.subtitle":
      "Rage-email? Awkward text? Mid cover letter? Paste the mess. Get something you'd actually hit send on — in seconds.",
    "hero.cta": "Fix My Mess (1st try's on us 🎁)",
    "hero.modulusFamily": "Part of the MODULUS family —",
    "hero.badge.noSubscription": "No subscription trap",
    "hero.badge.noSignups": "Free taste available",
    "hero.badge.payPerUse": "Pay when you generate",
    "promo.isend101.ariaLabel": "Limited-time discount offer",
    "promo.isend101.badge": "Limited-time offer",
    "promo.isend101.title": "50% off — go feral, pay less 🔥",
    "promo.isend101.body":
      "Use code {code} at checkout — {percent}% off any plan or credit pack for a limited time.",
    "promo.isend101.hint": "Enter the code on the secure Lemon Squeezy payment page before you pay.",
    "promo.isend101.codeLabel": "Your code",
    "promo.isend101.copy": "Copy code",
    "promo.isend101.copied": "Code copied to clipboard.",
    "promo.isend101.copiedShort": "Copied",
    "promo.isend101.copyFailed": "Could not copy — select the code manually.",
    "promo.isend101.viewPricing": "View plans & packs",
    "hero.badge.noStore": "We don’t store your text",

    "home.demo.before.label": "Before",
    "home.demo.after.label": "After",
    "home.demo.title": "Before & After (the glow-up is real)",
    "home.demo.subtitle":
      "Pick a vibe, watch the chaos turn civil, then steal the workflow for your own draft.",
    "home.demo.examples.corp.before":
      "This design is garbage, you clearly didn't read my brief!",
    "home.demo.examples.corp.after":
      "I feel we've drifted slightly from the original brief. Could we review the design to ensure it aligns with our initial vision?",
    "home.demo.examples.quit.before":
      "I'm done. I quit. Don't contact me again.",
    "home.demo.examples.quit.after":
      "Hi [Name] — I’m resigning effective [date]. Thank you for the opportunity. I’ll help transition my responsibilities and share documentation before I leave.",
    "home.demo.examples.gift.before":
      "I want to get you a gift but I have no idea what you want. Just tell me.",
    "home.demo.examples.gift.after":
      "I’d love to surprise you with something you’ll actually enjoy. If you were to pick one thing you’ve been wanting lately, what would it be?",
    "home.demo.examples.caveman.before":
      "Let's take this offline and circle back next week.",
    "home.demo.examples.caveman.after":
      "I hate this. Later.",

    "section.tools.title": "Pick a tool. Paste chaos. Leave with confidence.",
    "section.tools.subtitle":
      "Work emails, job apps, dating bios — micro-tools that fix how you sound, fast.",
    "tabs.corporate": "Corporate",
    "tabs.coverletter": "Cover Letter",
    "tabs.dating": "Dating Bio",

    "how.title": "How it works",
    "how.1.title": "1) Paste",
    "how.1.body": "Drop your draft, job post, or bio. No formatting needed.",
    "how.2.title": "2) Improve",
    "how.2.body": "AI rewrites with better tone, structure, and clarity.",
    "how.3.title": "3) Copy & send",
    "how.3.body": "Get a clean result with a one-click copy button.",

    "how.detailed.title": "How It Works (4 steps, zero cringe)",
    "how.detailed.subtitle":
      "Messy thoughts → send-ready message in under 10 seconds. No corporate tutorial energy.",
    "how.detailed.1.title": "1) Choose your tool",
    "how.detailed.1.body":
      "Browse our micro-tools from the menu, or just ask the AI Concierge to find the perfect one for your specific situation.",
    "how.detailed.2.title": "2) Paste your messy draft",
    "how.detailed.2.body":
      "Drop in your angry email, awkward text, or basic notes. Don't worry about typos or formatting—just brain dump.",
    "how.detailed.3.title": "3) Select your AI power",
    "how.detailed.3.body":
      "Go with 'Fast AI' (1 Credit) for quick fixes, or 'Pro AI' (25 Credits) for high-stakes messages. The exact credit cost is always transparent on the button.",
    "how.detailed.4.title": "4) Polish & Send",
    "how.detailed.4.body":
      "Review the polished result, copy it, or ask the AI to generate a different variation. Hit send with 100% confidence.",

    "products.title": "The hits (fast, punchy, unhinged in a good way)",
    "products.subtitle": "One job each: make you sound human, hired, or dateable — faster.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Say it firmly. Send it safely.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "Tailored, ATS-friendly, interview-ready.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Less cringe. More matches.",

    "faq.q1": "Do you store my text?",
    "faq.a1":
      "No. Your input is kept in your browser (localStorage) to complete the flow.",
    "faq.q2": "How does payment work?",
    "faq.a2": "Pay per use. Secure checkout via Lemon Squeezy. No subscription traps.",
    "faq.q3": "What do I get?",
    "faq.a3":
      "A polished output you can copy immediately—email, cover letter, or bio.",

    "footer.copyright": "© 2026 isendai.com. Crafted for better communication.",
    "footer.trust":
      "🔒 Lemon Squeezy checkout | ⚡ AI-powered glow-ups | 🚫 We don't hoard your drafts",
    "footer.modulusLead": "Part of the MODULUS family —",
    "footer.modulus": "MODULUS corporate site",

    "tool.corp.desc":
      "Want to yell at your boss or client? Don't. Type your angry, unfiltered thoughts here, and we'll turn it into a polite, HR-friendly masterpiece.",
    "tool.corp.placeholder":
      `Type what you REALLY want to say... (e.g., "This design is garbage and you clearly didn't read my brief.")`,
    "tool.corp.button": "Translate to Professional",

    "tool.cover.desc":
      "Tired of writing the same letter for every job? Paste the job URL and your skills. We'll generate a tailored, ATS-beating cover letter that gets interviews.",
    "tool.cover.placeholder1": "Paste Job Description or URL...",
    "tool.cover.placeholder2": "Paste your resume text or key skills...",
    "tool.cover.button": "Generate Cover Letter",

    "tool.dating.desc":
      "Not getting matches? Our AI will brutally roast your current bio, tell you exactly why it's failing, and write a magnetic new one for you.",
    "tool.dating.placeholder":
      "Paste your current Tinder/Bumble bio or describe your vibe...",
    "tool.dating.button": "Roast & Fix My Profile",

    "success.test": "Test mode. Generating your result…",
    "success.paid": "Payment received. Generating your result…",
    "success.introCredits":
      "Credits are deducted from your balance based on the model and input length (500-character blocks, rounded up).",
    "success.insufficientFallback": "Not enough credits to run this generation.",
    "success.insufficientTitle": "You’re out of credits",
    "success.insufficientBody":
      "See Pricing for packs and top-ups. For local testing, follow the dev top-up notes on that page, sign in, or ask your admin to add credits.",
    "success.usingSaved": "We’re using your saved input from localStorage.",
    "success.generating": "Generating…",
    "success.copy": "Copy to Clipboard",
    "success.shareOnX": "Share on X",
    "success.shareOnXAria": "Share this result on X",
    "success.downloadSocial": "Download for IG/TikTok",
    "success.downloadSocialAria": "Download share image for Instagram or TikTok",
    "success.downloadSocialToast": "Image downloaded — ready to post!",
    "success.downloadSocialFailed": "Could not create the image.",
    "success.shareOnLinkedIn": "Share on LinkedIn",
    "success.shareOnLinkedInAria": "Share this result on LinkedIn",
    "success.shareLinkedInToast":
      "Text copied! Paste it in your LinkedIn post.",
    "success.shareLinkedInCopyFailed":
      "Couldn't copy to clipboard. Try copying the text manually.",
    "success.yourQuestion": "Your question",
    "success.aiAnswer": "AI answer",
    "success.shareToolbarAria": "Share this result",
    "success.shareOnFacebook": "Share on Facebook",
    "success.shareOnFacebookAria": "Share this result on Facebook",
    "success.shareFacebookToast":
      "Text copied! Paste it in your Facebook post.",
    "success.shareOnInstagram": "Share on Instagram",
    "success.shareOnInstagramAria": "Share this result on Instagram",
    "success.shareInstagramToast":
      "Text copied! Paste it in your Instagram caption.",
    "success.shareOnTikTok": "Share on TikTok",
    "success.shareOnTikTokAria": "Share this result on TikTok",
    "success.shareTikTokToast": "Text copied! Paste it in your TikTok caption.",
    "success.shareCopyFailed":
      "Couldn't copy to clipboard. Try copying the text manually.",
    "success.ready": "Ready when you are.",

    "success.ephemeral.title": "Heads up",
    "success.ephemeral.body":
      "These results are temporary. If you close this tab/window, they will be deleted and you won’t be able to access them again.",
    "success.alt.generate": "Generate alternative",
    "success.alt.panelTitle": "Create another version",
    "success.alt.modelLabel": "AI version for this alternative",
    "success.alt.limit": "You’ve reached the maximum of 5 alternatives for this generation.",
    "success.alt.version": "Version",
    "success.alt.extra.label": "Extra instructions for the next version (optional)",
    "success.alt.extra.placeholder":
      "e.g., more human, slightly funny, shorter, more formal, add warmth, etc.",
    "success.versions": "Saved versions:",
    "success.selectedVersion": "Selected version:",
    "success.feedback.question": "How did AI do?",
    "success.feedback.thanks": "Thanks for helping our AI evolve! ✨",
    "success.feedback.thumbsUpAria": "Good result",
    "success.feedback.thumbsDownAria": "Poor result",

    "home.sidebar.title": "AI Products",
    "home.workspace.hint": "Paste → Generate → Copy",
    "home.aiStack.title": "The World's Leading AI Models in One Place 🧠",
    "home.aiStack.body":
      "Behind the scenes, the brains of tech giants like OpenAI (ChatGPT), Anthropic (Claude), Google, and DeepSeek work for you. Don't want to think about which model to pick? Leave it on Auto — we'll choose the best fit for your moment. Or take full control and pick your own intelligence from the menu! (Credit usage is calculated transparently based on the tier of the model you choose.)",
    "home.expertBots.kicker": "Domain expert bots",
    "home.expertBots.title": "Not one chatbot — a specialist for every topic",
    "home.expertBots.lead":
      "isendai is built like a fleet of expert bots, not a single generic assistant. Each tool is tuned for its niche—work email, cover letters, dating, freelance SOWs, bureaucracy, neighbors, creators, family—with dedicated prompts, scope checks, and smart routing to the best model for that category.",
    "home.expertBots.point1":
      "Topic-native bots: 80+ micro-tools across eight life domains, each with its own persona and output format.",
    "home.expertBots.point2":
      "Multi-provider engine: OpenAI, Anthropic, Gemini, Groq, and DeepSeek—auto-routed or hand-picked from one menu.",
    "home.expertBots.point3":
      "Production-grade stack: per-tool scope gates, transparent credit billing, version history, and replies in your language.",

    "concierge.title": "ISENDAI",
    "concierge.welcome":
      "Hi — what do you need help with today? (e.g., a work email, a cover letter, a refund message, a dating bio)",
    "concierge.placeholder": "Tell me what you’re trying to do…",
    "concierge.send": "Send",
    "concierge.thinking": "Thinking…",
    "concierge.modelLabel": "AI model for replies",
    "concierge.openTool": "Open tool",
    "concierge.offScope.lead":
      "We can help with isendai writing tools—for example drafting a smoother message to ask what gift they want.",
    "concierge.offScope.try": "Try these tools:",
    "concierge.errors.chatFailed": "Chat failed. Please try again.",
    "concierge.errors.noReply": "No reply from the assistant.",
    "concierge.errors.invalidBody": "Invalid chat request.",
    "concierge.errors.missingApi": "Concierge is not configured.",
    "concierge.errors.invalidModel": "Invalid AI model.",
    "concierge.errors.missingProvider": "AI provider is not configured.",
    "concierge.errors.aiFailed": "Could not get a reply. Please try again.",
    "concierge.errors.server": "Server error. Please try again shortly.",
    "concierge.errors.authRequired": "Sign in to use the assistant chat.",

    "deploy.stagingBanner":
      "Staging environment — not live for customers. Test here before merging to main.",
    "deploy.stagingOpenProduction": "Open production (isendai.com)",

    "nav.backToHome": "Back to Home",
    "nav.pricing": "Pricing",
    "nav.privacy": "Privacy",
    "nav.terms": "Terms",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "legal.contact.lead": "Questions? Email",
    "announce.newModel.badge": "New",
    "announce.newModel.title": "{model} is here",
    "announce.newModel.body": "Our {tier} tier now runs on {model} — sharper, more reliable results on the same credits.",
    "announce.dismiss": "Got it",
    "contact.title": "Contact",
    "contact.lead": "Questions about billing, your account, or the product? Send a message or email",
    "contact.nameLabel": "Name",
    "contact.emailLabel": "Email",
    "contact.subjectLabel": "Subject (optional)",
    "contact.messageLabel": "Message",
    "contact.submit": "Send message",
    "contact.sending": "Sending…",
    "contact.successToast": "Message sent — we’ll get back to you soon.",
    "contact.successBody": "Thanks! Your message was received. We usually reply within one business day.",
    "contact.errors.send": "Could not send your message. Try again or email support.",
    "nav.login": "Sign in · Membership",
    "nav.history": "History",
    "nav.account": "Account",
    "nav.logout": "Log out",

    "creditsNav.title": "Credits balance",
    "creditsNav.unit": "Credits",
    "creditsNav.trialOne": "Trial: 1 day left",
    "creditsNav.trialMany": "Trial: {days} days left",

    "modelSwitcher.ariaLabel": "AI model version",
    "modelSwitcher.fast": "Fast AI (1 Credit)",
    "modelSwitcher.pro": "Pro AI (15 Credits)",
    "modelSwitcher.genius": "Genius AI (25 Credits)",
    "modelSwitcher.auto": "Auto (tool picks provider)",
    "modelSwitcher.quickTiers": "Quick tiers",
    "modelSwitcher.providerOpenai": "OpenAI",
    "modelSwitcher.providerAnthropic": "Anthropic",
    "modelSwitcher.providerGoogle": "Google Gemini",
    "modelSwitcher.providerGroq": "Groq",
    "modelSwitcher.providerDeepseek": "DeepSeek",

    "usage.creditsHeading": "Credits",
    "usage.versionsLine": "Versions per generation: {max}",
    "usage.requestsHeading": "Generations",
    "usage.open": "Open",
    "usage.rerun": "Re-run",
    "usage.modelLabel": "Model",
    "usage.chargedLine": "Credits charged: {charged} · Max versions: {max}",
    "usage.emptyRequests": "No generations yet.",
    "history.title": "History",
    "history.subtitleUser": "Requests on your account",
    "account.pageTitle": "Account",
    "account.recentRequests": "Recent generations",
    "request.pageTitle": "Request",
    "request.timeCreditsLine":
      "{date} · Credits charged: {charged} · Max versions: {max}",
    "request.inputStored": "Stored input",
    "request.versions": "Versions",
    "request.versionLine": "Version {idx}",
    "request.noVersions": "No versions saved yet.",
    "home.creditsSummary": "Credits: {credits} · Versions per generation: {max} · {scope}",
    "home.creditsScopeUser": "Signed in",
    "ui.copy": "Copy",
    "ui.copying": "Copying…",
    "ui.copied": "Copied.",
    "ui.copySuccessToast": "Copied to clipboard! 📋",
    "ui.copyFailed": "Could not copy.",

    "billing.lemon.pendingReview":
      "Payments: Lemon Squeezy merchant review in progress. Checkout may open in test mode only — live card charges start after approval. Need credits now? Staging dev top-up or info@modulustech.app / Contact.",
    "billing.lemon.testMode":
      "Payments: Lemon Squeezy is in test mode. Use test cards in checkout; live charges require live mode in the Lemon dashboard and Netlify env.",
    "billing.lemon.unconfigured":
      "Payments: Lemon Squeezy is not fully configured on this deploy. Set LEMON_SQUEEZY_* env vars or use dev top-up on staging.",
    "pricing.title": "Pricing",
    "pricing.subtitle":
      "Monthly from $7.99, yearly ~17% off, or pay-as-you-go from $1. Economy & GPT‑4o mini: 1 credit per 500 chars; Standard 15; Premium 25 (per chunk, rounded up).",
    "pricing.hero.intro": "Three ways to load credits — same rules everywhere in the app:",
    "pricing.hero.tagMonthly": "Monthly",
    "pricing.hero.tagAnnual": "Annual",
    "pricing.hero.annualSaveBadge": "~17% off",
    "pricing.hero.tagPaygo": "Pay-as-you-go",
    "pricing.hero.paygoHint": "Larger packs unlock more models.",
    "pricing.hero.footerMain":
      "Economy & GPT‑4o mini: 0.2 credits per 100 characters. Standard: 3; Premium: 5 — each extra block stacks.",
    "pricing.hero.footerJump": "How credits work",
    "pricing.monthly.sectionTitle": "Monthly credit bundles",
    "pricing.monthly.sectionLead":
      "Subscriptions renew each billing period via Lemon Squeezy. Pick Starter, Growth, or Scale to match how much you generate.",
    "pricing.monthly.starter.name": "Starter",
    "pricing.monthly.starter.price": "$7.99",
    "pricing.monthly.starter.credits": "500 credits / month",
    "pricing.monthly.starter.desc": "Entry monthly volume for individuals.",
    "pricing.monthly.starter.detail":
      "500 credits refilled every month\nFast AI (1 credit) or Pro AI (25 credits) per run\nAll micro-tools + AI Concierge included\nRenews monthly — cancel anytime",
    "pricing.monthly.growth.name": "Growth",
    "pricing.monthly.growth.price": "$9.99",
    "pricing.monthly.growth.credits": "1,000 credits / month",
    "pricing.monthly.growth.desc": "Best for steady daily use.",
    "pricing.monthly.growth.detail":
      "1,000 credits refilled every month\nIdeal for daily emails, DMs & workflows\nFast AI (1) or Pro AI (25) — cost always on the button\nRenews monthly — cancel anytime",
    "pricing.monthly.scale.name": "Scale",
    "pricing.monthly.scale.price": "$19.99",
    "pricing.monthly.scale.credits": "5,000 credits / month",
    "pricing.monthly.scale.desc": "Heavy usage, automation, and high monthly volume.",
    "pricing.monthly.scale.detail":
      "5,000 credits refilled every month\nBuilt for teams, automation & high volume\nFast, Pro & Genius AI when your balance allows\nBest tier for power users",
    "pricing.yearly.sectionTitle": "Annual bundles",
    "pricing.yearly.sectionLead":
      "Same three tiers as monthly, billed once per year. Yearly allowance: 6,000 / 12,000 / 60,000 credits (equivalent to 500 / 1,000 / 5,000 per month).",
    "pricing.yearly.starter.price": "$79 / year",
    "pricing.yearly.starter.credits": "6,000 credits / year",
    "pricing.yearly.starter.desc": "Matches Starter monthly volume with a lower effective monthly rate.",
    "pricing.yearly.starter.detail":
      "6,000 credits per year (500/month equivalent)\nSame tools & AI tiers as Starter monthly\n~17% cheaper than 12 monthly payments\nOne upfront payment — use all year",
    "pricing.yearly.starter.savings": "~17% less than paying monthly for 12 months",
    "pricing.yearly.growth.price": "$99 / year",
    "pricing.yearly.growth.credits": "12,000 credits / year",
    "pricing.yearly.growth.desc": "Matches Growth monthly volume — best for teams that commit annually.",
    "pricing.yearly.growth.detail":
      "12,000 credits per year\nSame features as Growth monthly\n~17% savings vs paying month-by-month\nGreat when you commit for the year",
    "pricing.yearly.growth.savings": "~17% less than paying monthly for 12 months",
    "pricing.yearly.scale.price": "$199 / year",
    "pricing.yearly.scale.credits": "60,000 credits / year",
    "pricing.yearly.scale.desc": "Matches Scale monthly volume — best value when you pay yearly upfront.",
    "pricing.yearly.scale.detail":
      "60,000 credits per year\nMaximum yearly pool for heavy throughput\n~17% off vs 12× Scale monthly\nBest value for agencies & teams",
    "pricing.yearly.scale.savings": "~17% less than paying monthly for 12 months",
    "pricing.pack.detailModalTitle": "{tier} — what's included",
    "pricing.pack.infoButtonAria": "Package details for {tier}",
    "pricing.paygo.sectionTitle": "Pay-as-you-go packs",
    "pricing.paygo.sectionLead":
      "One-time top-ups—no subscription. Larger packs unlock Standard and Premium model tiers.",
    "pricing.paygo.detailModalTitle": "{tier} — usage details",
    "pricing.paygo.infoButtonAria": "Usage details for {tier}",
    "pricing.paygo.closeDetails": "Close",
    "pricing.buyNow": "Buy now",
    "pricing.checkoutFailed": "Could not start checkout. Configure Lemon Squeezy variants or try again.",
    "pricing.checkoutSignInRequired": "Sign in to purchase a subscription.",
    "pricing.checkoutProfileRequired":
      "Complete your membership profile before purchasing — you’ll be redirected there now.",
    "pricing.pack.budget": "10 credits · $1",
    "pricing.pack.standard": "25 credits · $1.49",
    "pricing.pack.premium": "50 credits · $1.99",
    "pricing.allPaygoPacks": "10 credits · $1 · 25 credits · $1.49 · 50 credits · $1.99",
    "pricing.tier.budget": "Budget",
    "pricing.tier.standard": "Standard",
    "pricing.tier.premium": "Premium",
    "pricing.tier.budgetPrice": "$1",
    "pricing.tier.standardPrice": "$1.49",
    "pricing.tier.premiumPrice": "$1.99",
    "pricing.tier.budgetSummary": "One-time · Fast AI (1 credit per run)",
    "pricing.tier.standardSummary": "One-time · Fast + Pro AI (up to 25 credits)",
    "pricing.tier.premiumSummary": "One-time · Fast, Pro & Genius AI",
    "pricing.tier.budgetDesc":
      "$1 · 10 credits added instantly\nFast AI only — 1 credit per message\nQuick fixes & short polish\nNo subscription",
    "pricing.tier.standardDesc":
      "$1.49 · 25 credits added instantly\nFast AI (1) or Pro AI (25) per run\nImportant emails & high-stakes copy\nNo subscription",
    "pricing.tier.premiumDesc":
      "$1.99 · 50 credits added instantly\nUnlocks Fast, Pro & Genius AI\nBest $/credit for frequent users\nNo subscription",
    "pricing.usageGuide.sectionTitle": "How credits work (each generation)",
    "pricing.usageGuide.intro":
      "We bill in 100-character blocks (rounded up). Your pasted text plus any tool context counts toward the length.",
    "pricing.usageGuide.miniBadge": "Economy & mini",
    "pricing.usageGuide.miniTitle": "GPT‑4o mini & Economy models",
    "pricing.usageGuide.miniDesc":
      "0.2 credits per 100 characters. Example: 100 chars → 0.2; 500 → 1; 501 → 1.2 credits.",
    "pricing.usageGuide.scaleSectionTitle": "Standard & Premium — credits per 100 characters",
    "pricing.usageGuide.standardTitle": "Standard-tier models (examples)",
    "pricing.usageGuide.standardBullets":
      "3 credits per 100 characters\n~500 chars → ~15 credits\n~1,000 chars → ~30 credits\n~1,500 chars → ~45 credits",
    "pricing.usageGuide.premiumTitle": "Premium-tier models (examples)",
    "pricing.usageGuide.premiumBullets":
      "5 credits per 100 characters\n~500 chars → ~25 credits\n~1,000 chars → ~50 credits\n~1,500 chars → ~75 credits",
    "pricing.usageGuide.chartCaption": "Example totals",
    "pricing.usageGuide.colShort": "~500 chars",
    "pricing.usageGuide.colMid": "~1k chars",
    "pricing.usageGuide.colLong": "~1.5k chars",
    "pricing.usageGuide.chartHint":
      "Formula: ceil(characters ÷ 100) × tier rate. Bars are illustrative.",
    "pricing.usageGuide.footer":
      "When you click Generate, we calculate credits from your real prompt (paste + tool context). Each alternate version runs the same check again.",
    "pricing.modelNote.title": "Models by class",
    "pricing.modelNote.lead":
      "Each catalog model belongs to one billing class (same names as in the tool picker). Credit rates above apply per class; your pay-as-you-go pack may limit which classes you can select.",
    "pricing.modelNote.packHint":
      "$1 pack → Fast AI only · $1.49 pack → Fast + Pro AI · $1.99 pack → all three classes (Fast, Pro, Genius).",
    "pricing.sectionFootnote":
      "Version limits per generation still follow your account entitlements. Lemon Squeezy checkout for monthly bundles ships in a later phase.",
    "pricing.dev.title": "Developer mode",
    "pricing.dev.body": "Add credits locally during development (non-production only):",
    "pricing.dev.secretHint":
      "If DEV_TOPUP_SECRET is set in .env.local, send header X-Dev-Topup-Secret or Authorization: Bearer with that value.",
    "pricing.dev.disabled": "This endpoint is disabled in production.",

    "pricingModal.title": "Upgrade your credits",
    "pricingModal.subtitle":
      "7-day trial with bonus credits. If you don’t cancel before it ends, your paid subscription starts automatically. Yearly renewals are one payment for the full year. Credits reset each billing period.",
    "pricingModal.monthly": "Monthly",
    "pricingModal.yearly": "Yearly",
    "pricingModal.closeAria": "Close",
    "pricingModal.plan.basic": "Basic",
    "pricingModal.plan.pro": "Pro",
    "pricingModal.plan.ultra": "Ultra",
    "pricingModal.mostPopular": "Most popular",
    "pricingModal.planCreditsLine": "{credits} credits / month after the trial (each billing period)",
    "pricingModal.trialGiftLine": "{credits} bonus credits during the 7-day trial.",
    "pricingModal.afterTrialNote":
      "Cancel before the trial ends to avoid being charged; otherwise Lemon Squeezy renews into your paid plan automatically.",
    "pricingModal.yearSingleCharge":
      "Yearly after trial: each renewal is one charge of {total} (≈ {perMonth}/mo equivalent).",
    "pricingModal.startTrial": "Start 7-day free trial",
    "pricingModal.thenMonthly": "Then {price}/mo. Cancel anytime.",
    "pricingModal.thenYearly": "Then ~{price}/mo equivalent (20% off yearly). Cancel anytime.",
    "pricingModal.oneTimeTrial": "$1.49 one-time trial ({credits} credits)",
    "pricingModal.checkoutFailed": "Could not start checkout.",
    "pricingModal.trialAlreadyUsedToast":
      "You’ve already started a subscription trial from this browser.",
    "pricingModal.oneTimePacksTitle": "One-time credit packs",
    "pricingModal.oneTimePacksLead": "No subscription. Pay once — credits are added when the order is paid.",

    "notFound.title": "Page not found",
    "notFound.description": "The page you’re looking for doesn’t exist.",
    "errorPage.title": "Something went wrong",
    "errorPage.description": "We hit an unexpected error. Try again or return to the home page.",
    "errorPage.retry": "Try again",
    "errors.serverToast": "Server error. Please try again shortly.",
    "errors.generationFailed": "Generation failed.",
    "errors.signInRequired": "Please sign in to generate.",
    "errors.noModelResult": "No result returned.",
    "errors.outOfScope": "This choice doesn't quite match your text. {reason}",
    "errors.outOfScopeReason.generic":
      "Think of what you want to write in one sentence, then pick the closest tool.",
    "errors.outOfScopeReason.gift":
      "For asking what gift someone wants or polishing that message, use Awkward Text Fixer.",
    "errors.outOfScopeTryTool": "Suggested tool: {toolName}.",
    "errors.invalidJson": "Invalid request.",
    "errors.invalidPayload": "Invalid tool input.",
    "errors.inputTooLong": "Input must be at most {max} characters.",
    "errors.extraTooLong": "Extra instructions must be at most {max} characters.",
    "errors.rateLimit": "Too many requests. Please wait a moment and try again.",
    "errors.insufficientCredits":
      "Not enough credits for this generation. Add credits or choose a cheaper model.",
    "errors.insufficientCreditsDetail":
      "Not enough credits. This run needs {required} credits; your balance is {balance}.",
    "errors.insufficientCreditsAlt": "Not enough credits for another version.",
    "errors.insufficientCreditsAltDetail":
      "Not enough credits for another version. Need {required}; balance {balance}.",
    "errors.aiTemperatureUnsupported":
      "This model does not support that setting. Try Fast or Pro tier, or pick another model.",
    "legal.termsTitle": "Terms of Service",
    "legal.privacyTitle": "Privacy Policy",
    "legal.effective": "Effective date: {year}-01-01",
    "legal.termsMetaDescription":
      "Terms of Service for isendai. AI writing tools with subscriptions and credit packs.",
    "legal.privacyMetaDescription":
      "Privacy Policy for isendai. How we collect, use, and store your text and account data.",
    "legal.paymentsStub":
      "Paid packs and subscriptions are sold via Lemon Squeezy. While merchant approval is pending, you may only complete test checkouts or receive operator-granted credits.",
    "growth.zeroCreditsHint":
      "Balance is 0 — buy a pack on Pricing (when live), use staging dev top-up, or contact us for help.",
    "growth.freeTrial.ctaButton": "Generate 1st Message for Free 🎁",
    "growth.freeTrial.modalTitle": "Unlock your first free generation",
    "growth.freeTrial.modalBody":
      "Enter your email to unlock your first free AI generation on this device.",
    "growth.freeTrial.placeholder": "you@company.com",
    "growth.freeTrial.submit": "Unlock & generate",
    "growth.freeTrial.cancel": "Cancel",
    "growth.freeTrial.invalidEmail": "Please enter a valid email address.",
    "growth.freeTrial.deviceAlreadyUsed": "Free trial already used on this device.",
    "success.pageFallbackTitle": "Result",

    "auth.disabled": "Auth unavailable",
    "auth.disabledTitle":
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY), then redeploy or restart dev.",
    "auth.signedInFallback": "Signed in",
    "login.title": "Sign in",
    "login.subtitle":
      "Sign in with email, Google, or Facebook. After your first successful sign-in, we collect a short membership profile (name, country, primary use case).",
    "login.send": "Send link",
    "login.sending": "Sending…",
    "login.emailDivider": "Or sign in with email",
    "login.oauthTitle": "Quick sign-in",
    "login.oauthApple": "Apple",
    "login.oauthX": "X (Twitter)",
    "login.oauthLinkedin": "LinkedIn",
    "login.oauthInstagramSub": "Professional Instagram (business/creator) via Meta",
    "login.oauthTiktok": "TikTok",
    "login.oauthTiktokSub": "Requires a Custom OAuth provider id “tiktok” in Supabase",
    "login.oauthSetupHint":
      "Turn on each provider in Supabase → Authentication → Providers. Redirect URL must include /auth/callback",
    "login.oauthFailed": "Social sign-in failed.",
    "login.oauthCallbackFailed": "Could not finish sign-in. Try again or use email and password.",
    "login.oauthProviderError":
      "The provider returned an error (cancelled or misconfigured). Check Supabase redirect URLs and Google OAuth client.",
    "login.missingSupabase": "Sign-in is not configured (missing Supabase keys).",
    "login.membershipEmailTitle": "Email",
    "login.membershipEmailBody":
      "Use your personal email: create an account with a password, sign in with password, or request a one-time magic link (no password). After sign-in, you complete your membership profile.",
    "login.membershipSocialTitle": "Google or Facebook",
    "login.membershipSocialBody":
      "Sign in with Google or Facebook, then confirm or add membership details on the next screen.",
    "login.membershipGoogleTitle": "Google account",
    "login.membershipGoogleBody":
      "Use your Google identity, then confirm or add membership details on the next screen.",
    "login.membershipFacebookTitle": "Facebook account",
    "login.membershipFacebookBody":
      "Use your Facebook identity, then confirm or add membership details on the next screen.",
    "login.membershipInstagramTitle": "Instagram account",
    "login.membershipInstagramBody":
      "Professional (business or creator) Instagram accounts only. Instagram does not share email — complete your membership profile after sign-in.",
    "login.oauthInstagram": "Continue with Instagram",
    "login.oauthInstagramNotConfigured":
      "Instagram sign-in is not configured yet. Add the custom:instagram provider in Supabase (see README).",
    "login.membershipOtherTitle": "Other providers",
    "login.oauthGoogle": "Continue with Google",
    "login.oauthFacebook": "Continue with Facebook",
    "login.oauthOtherTitle": "More sign-in options",
    "login.emailInvalid": "Please enter a valid email address.",
    "login.emailSent": "Check your email for the sign-in link.",
    "login.sendFailed": "Could not send the sign-in link.",
    "login.emailRateLimit":
      "Too many emails were sent too quickly (Supabase limit). Wait several minutes and try again; project admins can raise limits or connect custom SMTP in Supabase Auth settings.",
    "login.emailPlaceholder": "you@domain.com",
    "login.passwordPlaceholder": "Password",
    "login.registerButton": "Create account",
    "login.signInPasswordButton": "Sign in with password",
    "login.passwordTooShort": "Password must be at least 6 characters.",
    "login.passwordRequired": "Enter your password.",
    "login.confirmEmailSent": "Check your email to confirm your account, then sign in.",
    "login.signUpExistingEmail":
      "This email may already be registered—no new confirmation email was sent. Try signing in with your password or request a magic link below.",
    "login.invalidCredentialsHint":
      "Those credentials didn’t work—often the password is wrong or the email isn’t confirmed yet. Try “Resend confirmation”, “Forgot password”, or the magic link below.",
    "login.resendConfirmButton": "Resend confirmation email",
    "login.resendConfirmToast":
      "If delivery succeeds, you should receive a confirmation email shortly (check spam too).",
    "login.forgotPasswordButton": "Forgot password?",
    "login.resetEmailSent": "Check your email for the password reset link (spam folder too).",
    "login.updatePasswordTitle": "Set a new password",
    "login.updatePasswordSubtitle":
      "You opened a valid reset link. Choose a new password, then continue to your account.",
    "login.newPasswordPlaceholder": "New password",
    "login.confirmPasswordPlaceholder": "Confirm new password",
    "login.updatePasswordSubmit": "Save new password",
    "login.passwordMismatch": "Passwords do not match.",
    "login.passwordUpdated": "Password updated.",
    "login.authFailed": "Could not complete sign-in.",
    "login.magicLinkDivider": "Or sign in without a password",
    "login.legalLead": "By continuing, you agree to our",
    "login.legalMid": "and",
    "login.legalEnd": ".",

    "profile.title": "Membership profile",
    "profile.oauthEmailMissing":
      "Facebook did not share your email. Enter it in the email field below, then save your profile.",
    "profile.subtitle":
      "These details are stored on your account (Supabase user metadata) to personalize support and product communication.",
    "profile.backToAccount": "Back to account",
    "profile.editLink": "Membership details",
    "profile.emailLabel": "Account email",
    "profile.emailPlaceholder": "you@example.com",
    "profile.emailHintOAuth":
      "Facebook did not share an email. Enter one here — we will save it to your account.",
    "profile.emailConfirmSent":
      "We sent a confirmation link to that address. Open it, then return here if needed.",
    "profile.fullName": "Full name",
    "profile.phone": "Phone (optional)",
    "profile.country": "Country / region",
    "profile.countryPlaceholder": "Select a country…",
    "profile.addressLabel": "Address (optional)",
    "profile.addressPlaceholder": "Street, building, apartment, district…",
    "profile.cityLabel": "City (optional)",
    "profile.organization": "Company or school (optional)",
    "profile.jobTitle": "Role or title (optional)",
    "profile.useCase": "Primary use case",
    "profile.useCasePlaceholder": "Select one…",
    "profile.useCaseWork": "Work & career",
    "profile.useCasePersonal": "Personal life admin",
    "profile.useCaseCreator": "Creator / social content",
    "profile.useCaseStudent": "Student / academic",
    "profile.useCaseAgency": "Agency / client work",
    "profile.useCaseOther": "Other",
    "profile.defaultAiModel": "Default AI version",
    "profile.defaultAiModelHint":
      "Pre-selected when you open a tool. You can still change it per question; your last choice is remembered on this device.",
    "profile.notes": "Anything else we should know? (optional)",
    "profile.notesPlaceholder": "Context, goals, languages you write in…",
    "profile.marketingOptIn": "Email me occasionally about new tools and tips (optional).",
    "profile.acceptTerms":
      "I confirm the information is accurate and I accept the Terms of Service and Privacy Policy.",
    "profile.save": "Save and continue",
    "profile.saving": "Saving…",
    "profile.saved": "Profile saved.",
    "profile.errors.required": "Please fill in all required fields.",
    "profile.errors.emailRequired": "Please enter your email address.",
    "profile.errors.emailInvalid": "Please enter a valid email address.",
    "profile.errors.terms": "You must accept the terms to continue.",
    "profile.errors.save": "Could not save your profile. Try again.",

    "tool.flow.hint":
      "Next we open the result page and generate using your credit balance. Need more credits? Visit Pricing for Lemon Squeezy checkout.",
    "tool.ctaCreditSuffix": " — varies by model and length",
    "tool.modelSelectLabel": "AI model for this request",
    "tool.priceReference": "Pay-as-you-go pack for this model tier: {pack}.",
    "tool.pricePackFlex":
      "All packs: 10 credits · $1 · 25 credits · $1.49 · 50 credits · $1.99. See Pricing for how credits are calculated per generation.",
    "tool.validation.empty": "Please fill in the required fields before continuing.",
    "tool.billing.creditOne": "1 credit",
    "tool.billing.creditsMany": "{n} credits",
    "tool.billing.paidButton": "{action} · {amount}",

    "errors.toolParamMissing": "Missing or invalid tool parameter.",
    "errors.noSavedInput":
      "No saved input found in localStorage for this tool. Please go back and try again.",
    "errors.savedInputParse": "Saved input could not be parsed. Please go back and try again.",
    "errors.savedInputMismatch":
      "Saved input does not match the requested tool. Please go back and try again.",
    "errors.savedInputInvalid":
      "Saved input is incomplete for this tool. Please go back and enter more details.",

    "category.work-career.label": "Career Glow‑Up",
    "category.crisis-money.label": "Money & Oops Fixes",
    "category.social-dating.label": "Friends & Flings",
    "category.freelance-business.label": "Freelance Spark",
    "category.academic-bureaucracy.label": "Paperwork Wizardry",
    "category.neighbors-living.label": "Home Harmony",
    "category.creators-media.label": "Creator Studio",
    "category.family-deep-personal.label": "Heart‑to‑Heart",

    // Tool names (titles) are translated per-locale via tool.<id>.title (fallback: tool seed title)
    "tool.corporate-whisperer.title": "The Corporate Whisperer",
    "tool.coverletter-ai.title": "Click Cover Letter",
    "tool.dating-roast.title": "Dating Profile Roast & Fix",
    "tool.raise-negotiator.title": "The Raise Negotiator",
    "tool.graceful-quitter.title": "The Graceful Quitter",
    "tool.cold-dm-icebreaker.title": "The Cold DM Icebreaker",
    "tool.micromanager-tamer.title": "The Micromanager Tamer",
    "tool.invoice-chaser.title": "The Invoice Chaser",
    "tool.perfect-apology.title": "The Perfect Apology",
    "tool.refund-demander.title": "The Refund Demander",
    "tool.deadline-diplomat.title": "The Deadline Diplomat",
    "tool.landlord-diplomat.title": "The Landlord Diplomat",
    "tool.review-retaliator.title": "The Review Retaliator",
    "tool.ghosting-resurrector.title": "The Ghosting Resurrector",
    "tool.passive-aggressive-decoder.title": "The Passive-Aggressive Decoder",
    "tool.guilt-free-no.title": 'The Guilt‑Free "No"',
    "tool.delicate-truth.title": "The Delicate Truth",
    "tool.co-parenting-peacemaker.title": "The Co‑Parenting Peacemaker",
    "tool.friendzone-navigator.title": "The Friendzone Navigator",
    "tool.rsvp-diplomat.title": "The RSVP Diplomat",

    "tool.insurance-claim-letter.title": "Insurance Claim Letter",
    "tool.insurance-claim-letter.desc":
      "Draft a clear claim letter with facts, dates, and requested coverage.",

    "tool.linkedin-headline-smith.title": "LinkedIn Headline Smith",

    "tool.corporate-to-caveman-translator.title": "The Corporate-to-Caveman Translator",
    "tool.corporate-to-caveman-translator.desc":
      "Paste a long, boring corporate email. We translate it into the brutal, 3-word primitive truth.",
  },
  es: {
    "brand.name": "isendai",
    "header.theme": "Cambiar tema",
    "socialProof.demoPrefix": "Demo:",
    "hero.kicker": "Tu borrador caótico → mensaje listo para enviar ✨",
    "hero.title": "Aún no pulses Enviar. Arréglalo primero.",
    "hero.subtitle":
      "¿Email de rabia? ¿Texto incómodo? ¿Carta a medias? Pega el desastre. Llévate algo que sí enviarías — en segundos.",
    "hero.cta": "Arreglar mi desastre (1.er intento gratis 🎁)",
    "hero.modulusFamily": "Parte de la familia MODULUS —",
    "hero.badge.noSubscription": "Sin trampa de suscripción",
    "hero.badge.noSignups": "Prueba gratis disponible",
    "hero.badge.payPerUse": "Pagas al generar",
    "promo.isend101.ariaLabel": "Oferta por tiempo limitado",
    "promo.isend101.badge": "Oferta por tiempo limitado",
    "promo.isend101.title": "50 % off — desata el caos, paga menos 🔥",
    "promo.isend101.body":
      "Usa el código {code} al pagar — {percent} % de descuento en cualquier plan o pack por tiempo limitado.",
    "promo.isend101.hint": "Introduce el código en la página de pago segura de Lemon Squeezy antes de pagar.",
    "promo.isend101.codeLabel": "Tu código",
    "promo.isend101.copy": "Copiar código",
    "promo.isend101.copied": "Código copiado.",
    "promo.isend101.copiedShort": "Copiado",
    "promo.isend101.copyFailed": "No se pudo copiar — selecciona el código manualmente.",
    "promo.isend101.viewPricing": "Ver planes y packs",
    "hero.badge.noStore": "No guardamos tu texto",

    "home.demo.before.label": "Antes",
    "home.demo.after.label": "Después",
    "home.demo.title": "Antes y después",
    "home.demo.subtitle":
      "Elige un producto, mira la transformación y haz clic para generar el tuyo.",
    "home.demo.examples.corp.before":
      "Este diseño es un desastre, ¡está claro que no leíste mi briefing!",
    "home.demo.examples.corp.after":
      "Siento que nos hemos alejado un poco del briefing inicial. ¿Podemos revisar el diseño para asegurarnos de que encaja con la visión inicial?",
    "home.demo.examples.quit.before":
      "Ya está. Renuncio. No me contactes más.",
    "home.demo.examples.quit.after":
      "Hola [Nombre] — presento mi renuncia con efecto a partir del [fecha]. Gracias por la oportunidad. Ayudaré a hacer una transición ordenada y dejaré documentación antes de irme.",
    "home.demo.examples.gift.before":
      "Quiero comprarte un regalo pero no sé qué quieres. Dímelo ya.",
    "home.demo.examples.gift.after":
      "Me encantaría sorprenderte con algo que de verdad te guste. Si pudieras elegir una cosa que has estado queriendo últimamente, ¿cuál sería?",
    "home.demo.examples.caveman.before":
      "Hablemos de esto fuera de aquí y lo retomamos la próxima semana.",
    "home.demo.examples.caveman.after":
      "Odio esto. Luego.",

    "section.tools.title": "Elige una herramienta. Pega tu texto. Mejora al instante.",
    "section.tools.subtitle":
      "Para la vida real: correos de trabajo, solicitudes y biografías de citas.",
    "tabs.corporate": "Corporativo",
    "tabs.coverletter": "Carta",
    "tabs.dating": "Bio",
    "how.title": "Cómo funciona",
    "how.1.title": "1) Pega",
    "how.1.body": "Pega tu borrador, oferta o bio. Sin formato.",
    "how.2.title": "2) Mejora",
    "how.2.body": "La IA reescribe con mejor tono, estructura y claridad.",
    "how.3.title": "3) Copia y envía",
    "how.3.body": "Obtén un resultado limpio con copiar en un clic.",

    "how.detailed.title": "Cómo funciona (4 pasos sencillos)",
    "how.detailed.subtitle":
      "Transforma tus ideas desordenadas en mensajes perfectos en menos de 10 segundos.",
    "how.detailed.1.title": "1) Elige tu herramienta",
    "how.detailed.1.body":
      "Explora nuestras microherramientas en el menú o pide al AI Concierge que encuentre la ideal para tu situación.",
    "how.detailed.2.title": "2) Pega tu borrador",
    "how.detailed.2.body":
      "Pega tu correo enfadado, mensaje incómodo o notas sueltas. No te preocupes por faltas ni formato: suelta todo.",
    "how.detailed.3.title": "3) Elige tu potencia de IA",
    "how.detailed.3.body":
      "Usa 'Fast AI' (1 crédito) para arreglos rápidos o 'Pro AI' (25 créditos) para mensajes importantes. El coste exacto siempre aparece en el botón.",
    "how.detailed.4.title": "4) Pulir y enviar",
    "how.detailed.4.body":
      "Revisa el resultado, cópialo o pide otra variación. Envía con total confianza.",
    "products.title": "Productos (rápidos y efectivos)",
    "products.subtitle": "Herramientas con una sola misión: sonar mejor, más rápido.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Firme, pero seguro.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "A medida, ATS, listo para entrevista.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Menos cringe. Más matches.",
    "faq.q1": "¿Guardan mi texto?",
    "faq.a1": "No. Se guarda en tu navegador (localStorage) para completar el flujo.",
    "faq.q2": "¿Cómo funciona el pago?",
    "faq.a2": "Pago por uso. Checkout seguro con Lemon Squeezy. Sin trampas.",
    "faq.q3": "¿Qué recibo?",
    "faq.a3": "Un texto pulido que puedes copiar al instante.",
    "footer.copyright": "© 2026 isendai.com. Hecho para comunicar mejor.",
    "footer.modulusLead": "Parte de la familia MODULUS —",
    "footer.modulus": "Sitio corporativo MODULUS",
    "footer.trust":
      "🔒 Pagos seguros con Lemon Squeezy | ⚡ Impulsado por IA | 🚫 No guardamos tus datos.",
    "tool.corp.desc":
      "¿Quieres gritarle a tu jefe o cliente? No lo hagas. Escribe lo que piensas y lo convertimos en un correo educado y apto para RR. HH.",
    "tool.corp.placeholder":
      `Escribe lo que REALMENTE quieres decir... (p. ej., "Este diseño es basura y ni leíste el brief.")`,
    "tool.corp.button": "Traducir a profesional",
    "tool.action.generic": "Generar",
    "tool.placeholder.generic": "Pega tu texto aquí…",
    "tool.cover.desc":
      "¿Cansado de la misma carta para cada puesto? Pega la URL/oferta y tus habilidades. Generamos una carta a medida que consigue entrevistas.",
    "tool.cover.placeholder1": "Pega la descripción o URL del trabajo...",
    "tool.cover.placeholder2": "Pega tu CV o habilidades clave...",
    "tool.cover.button": "Generar carta",
    "tool.dating.desc":
      "¿Pocos matches? La IA critica tu bio, te dice por qué falla y escribe una nueva y magnética.",
    "tool.dating.placeholder": "Pega tu bio de Tinder/Bumble o describe tu vibra...",
    "tool.dating.button": "Roast y arreglar",
    "success.test": "Modo test. Generando…",
    "success.paid": "Pago recibido. Generando…",
    "success.introCredits":
      "Se descontarán créditos de tu saldo según el modelo y la longitud del texto (bloques de 500 caracteres).",
    "success.insufficientFallback": "No hay créditos suficientes para generar.",
    "success.insufficientTitle": "Sin créditos",
    "success.insufficientBody":
      "Mira Precios para paquetes y recargas. En local, sigue las notas de recarga de desarrollo en esa página, inicia sesión o pide créditos al administrador.",
    "success.usingSaved": "Usamos tu texto guardado en localStorage.",
    "success.generating": "Generando…",
    "success.copy": "Copiar",
    "success.shareOnX": "Compartir en X",
    "success.shareOnXAria": "Compartir este resultado en X",
    "success.downloadSocial": "Descargar para IG/TikTok",
    "success.downloadSocialAria": "Descargar imagen para Instagram o TikTok",
    "success.downloadSocialToast": "Imagen descargada — ¡lista para publicar!",
    "success.downloadSocialFailed": "No se pudo crear la imagen.",
    "success.shareOnLinkedIn": "Compartir en LinkedIn",
    "success.shareOnLinkedInAria": "Compartir este resultado en LinkedIn",
    "success.shareLinkedInToast":
      "¡Texto copiado! Pégalo en tu publicación de LinkedIn.",
    "success.shareLinkedInCopyFailed":
      "No se pudo copiar al portapapeles. Intenta copiar el texto manualmente.",
    "success.yourQuestion": "Tu pregunta",
    "success.aiAnswer": "Respuesta de la IA",
    "success.shareToolbarAria": "Compartir este resultado",
    "success.shareOnFacebook": "Compartir en Facebook",
    "success.shareOnFacebookAria": "Compartir este resultado en Facebook",
    "success.shareFacebookToast":
      "¡Texto copiado! Pégalo en tu publicación de Facebook.",
    "success.shareOnInstagram": "Compartir en Instagram",
    "success.shareOnInstagramAria": "Compartir este resultado en Instagram",
    "success.shareInstagramToast":
      "¡Texto copiado! Pégalo en la leyenda de Instagram.",
    "success.shareOnTikTok": "Compartir en TikTok",
    "success.shareOnTikTokAria": "Compartir este resultado en TikTok",
    "success.shareTikTokToast":
      "¡Texto copiado! Pégalo en la descripción de TikTok.",
    "success.shareCopyFailed":
      "No se pudo copiar al portapapeles. Intenta copiar el texto manualmente.",
    "success.ready": "Listo cuando tú lo estés.",

    "success.ephemeral.title": "Aviso",
    "success.ephemeral.body":
      "Estos resultados son temporales. Si cierras esta pestaña/ventana, se eliminarán y no podrás acceder a ellos de nuevo.",
    "success.alt.generate": "Generar alternativa",
    "success.alt.panelTitle": "Crear otra versión",
    "success.alt.modelLabel": "Versión de IA para esta alternativa",
    "success.alt.limit": "Has alcanzado el máximo de 5 alternativas para esta generación.",
    "success.alt.version": "Versión",
    "success.alt.extra.label": "Instrucciones extra para la próxima versión (opcional)",
    "success.alt.extra.placeholder":
      "p. ej., más humano, un poco gracioso, más corto, más formal, más cálido, etc.",
    "success.versions": "Versiones guardadas:",
    "success.selectedVersion": "Versión seleccionada:",
    "success.feedback.question": "¿Qué tal lo hizo la IA?",
    "success.feedback.thanks": "¡Gracias por ayudar a que nuestra IA evolucione! ✨",
    "success.feedback.thumbsUpAria": "Buen resultado",
    "success.feedback.thumbsDownAria": "Mal resultado",

    "home.sidebar.title": "Productos de IA",
    "home.workspace.hint": "Pega → Genera → Copia",
    "home.aiStack.title": "Los Principales Modelos de IA del Mundo en Un Solo Lugar 🧠",
    "home.aiStack.body":
      "En segundo plano trabajan para ti los cerebros de gigantes tecnológicos como OpenAI (ChatGPT), Anthropic (Claude), Google y DeepSeek. ¿No quieres pensar qué modelo elegir? Déjalo en «Automático» y elegimos el más adecuado para tu momento. ¡O toma el control y elige tu propia inteligencia en el menú! (El uso de créditos se calcula con transparencia según el nivel del modelo que elijas).",
    "home.expertBots.kicker": "Bots expertos por tema",
    "home.expertBots.title": "No es un solo chatbot: un especialista para cada tema",
    "home.expertBots.lead":
      "isendai está diseñado como una flota de bots expertos, no un asistente genérico. Cada herramienta está afinada para su nicho—email laboral, cartas, citas, SOW freelance, trámites, vecinos, creadores, familia—con prompts dedicados, control de alcance y enrutado inteligente al mejor modelo.",
    "home.expertBots.point1":
      "Bots por dominio: más de 80 micro-herramientas en ocho áreas de la vida, cada una con su propia personalidad y formato.",
    "home.expertBots.point2":
      "Motor multi-proveedor: OpenAI, Anthropic, Gemini, Groq y DeepSeek—automático o elegido a mano desde un menú.",
    "home.expertBots.point3":
      "Stack de producción: filtros de alcance, créditos transparentes, historial de versiones y respuestas en tu idioma.",

    "category.work-career.label": "Brillo Profesional",
    "category.crisis-money.label": "Dinero & Apagafuegos",
    "category.social-dating.label": "Amigos & Citas",
    "category.freelance-business.label": "Freelance en Marcha",
    "category.academic-bureaucracy.label": "Papeleos con Estilo",
    "category.neighbors-living.label": "Hogar en Paz",
    "category.creators-media.label": "Estudio Creador",
    "category.family-deep-personal.label": "De Corazón a Corazón",

    "concierge.title": "ISENDAI",
    "concierge.welcome":
      "Hola — ¿en qué necesitas ayuda hoy? (p. ej., un email de trabajo, una carta de presentación, un mensaje de reembolso, una bio de citas)",
    "concierge.placeholder": "Cuéntame qué quieres lograr…",
    "concierge.send": "Enviar",
    "concierge.thinking": "Pensando…",
    "concierge.modelLabel": "Modelo de IA para respuestas",
    "concierge.offScope.lead":
      "Podemos ayudarte con las herramientas de escritura de isendai—por ejemplo un mensaje más natural para preguntar qué regalo quiere.",
    "concierge.offScope.try": "Prueba estas herramientas:",
    "concierge.errors.chatFailed": "El chat falló. Inténtalo de nuevo.",
    "concierge.errors.noReply": "No hubo respuesta del asistente.",
    "concierge.errors.invalidBody": "Solicitud de chat no válida.",
    "concierge.errors.missingApi": "Concierge no está configurado.",
    "concierge.errors.invalidModel": "Modelo de IA no válido.",
    "concierge.errors.missingProvider": "Proveedor de IA no configurado.",
    "concierge.errors.aiFailed": "No se pudo obtener respuesta. Inténtalo de nuevo.",
    "concierge.errors.server": "Error del servidor. Inténtalo en un momento.",
    "concierge.errors.authRequired": "Inicia sesión para usar el chat del asistente.",

    "deploy.stagingBanner":
      "Entorno de pruebas — no es el sitio en vivo. Prueba aquí antes de fusionar a main.",
    "deploy.stagingOpenProduction": "Abrir producción (isendai.com)",

    "nav.backToHome": "Volver al inicio",
    "nav.pricing": "Precios",
    "nav.privacy": "Privacidad",
    "nav.terms": "Términos",
    "nav.faq": "FAQ",
    "nav.contact": "Contacto",
    "legal.contact.lead": "¿Preguntas? Escribe a",
    "announce.newModel.badge": "Nuevo",
    "announce.newModel.title": "Ya está {model}",
    "announce.newModel.body": "Nuestro nivel {tier} ahora usa {model}: resultados más precisos y fiables con los mismos créditos.",
    "announce.dismiss": "Entendido",
    "contact.title": "Contacto",
    "contact.lead": "¿Dudas sobre facturación, tu cuenta o el producto? Escríbenos o envía un correo a",
    "contact.nameLabel": "Nombre",
    "contact.emailLabel": "Correo",
    "contact.subjectLabel": "Asunto (opcional)",
    "contact.messageLabel": "Mensaje",
    "contact.submit": "Enviar mensaje",
    "contact.sending": "Enviando…",
    "contact.successToast": "Mensaje enviado — te responderemos pronto.",
    "contact.successBody": "¡Gracias! Recibimos tu mensaje. Solemos responder en un día laborable.",
    "contact.errors.send": "No se pudo enviar. Inténtalo de nuevo o escribe a soporte.",
    "nav.login": "Acceso · Cuenta",
    "nav.history": "Historial",
    "nav.account": "Mi cuenta",
    "nav.logout": "Cerrar sesión",

    "creditsNav.title": "Saldo de créditos",
    "creditsNav.unit": "Créditos",
    "creditsNav.trialOne": "Prueba: queda 1 día",
    "creditsNav.trialMany": "Prueba: quedan {days} días",

    "modelSwitcher.ariaLabel": "Versión del modelo de IA",
    "modelSwitcher.fast": "Fast AI (1 crédito)",
    "modelSwitcher.pro": "Pro AI (15 créditos)",
    "modelSwitcher.genius": "Genius AI (25 créditos)",
    "modelSwitcher.auto": "Auto (la herramienta elige proveedor)",
    "modelSwitcher.quickTiers": "Niveles rápidos",
    "modelSwitcher.providerOpenai": "OpenAI",
    "modelSwitcher.providerAnthropic": "Anthropic",
    "modelSwitcher.providerGoogle": "Google Gemini",
    "modelSwitcher.providerGroq": "Groq",
    "modelSwitcher.providerDeepseek": "DeepSeek",

    "usage.creditsHeading": "Créditos",
    "usage.versionsLine": "Versiones por generación: {max}",
    "usage.requestsHeading": "Generaciones",
    "usage.open": "Abrir",
    "usage.rerun": "Repetir",
    "usage.modelLabel": "Modelo",
    "usage.chargedLine": "Créditos usados: {charged} · Máx. versiones: {max}",
    "usage.emptyRequests": "Aún no hay generaciones.",
    "history.title": "Historial",
    "history.subtitleUser": "Solicitudes en tu cuenta",
    "account.pageTitle": "Cuenta",
    "account.recentRequests": "Generaciones recientes",
    "request.pageTitle": "Solicitud",
    "request.timeCreditsLine":
      "{date} · Créditos usados: {charged} · Máx. versiones: {max}",
    "request.inputStored": "Entrada guardada",
    "request.versions": "Versiones",
    "request.versionLine": "Versión {idx}",
    "request.noVersions": "Aún no hay versiones guardadas.",
    "home.creditsSummary": "Créditos: {credits} · Versiones por generación: {max} · {scope}",
    "home.creditsScopeUser": "Con sesión",
    "ui.copy": "Copiar",
    "ui.copying": "Copiando…",
    "ui.copied": "Copiado.",
    "ui.copySuccessToast": "¡Copiado al portapapeles! 📋",
    "ui.copyFailed": "No se pudo copiar.",

    "billing.lemon.pendingReview":
      "Pagos: revisión Lemon Squeezy en curso. Checkout solo en test hasta aprobación. ¿Créditos? Top-up dev en staging o info@modulustech.app / Contacto.",
    "billing.lemon.testMode":
      "Pagos: Lemon Squeezy en modo test. Usa tarjetas de prueba; los cobros reales requieren modo live en Lemon y Netlify.",
    "billing.lemon.unconfigured":
      "Pagos: Lemon Squeezy no está configurado en este deploy. Define LEMON_SQUEEZY_* o usa top-up dev en staging.",
    "pricing.title": "Precios",
    "pricing.subtitle":
      "Desde $7.99/mes, anual ~17 % menos o pago por uso desde $1. Economy y GPT‑4o mini: 1 crédito por 500 caracteres; Estándar 15; Premium 25 (por bloque, redondeo superior).",
    "pricing.hero.intro": "Tres formas de cargar créditos — mismas reglas en toda la app:",
    "pricing.hero.tagMonthly": "Mensual",
    "pricing.hero.tagAnnual": "Anual",
    "pricing.hero.annualSaveBadge": "~17 % menos",
    "pricing.hero.tagPaygo": "Pago por uso",
    "pricing.hero.paygoHint": "Los packs mayores desbloquean más modelos.",
    "pricing.hero.footerMain":
      "Economy y GPT‑4o mini: 1 crédito por bloque de 500 caracteres. Estándar: 15; Premium: 25 — cada bloque extra se acumula.",
    "pricing.hero.footerJump": "Cómo se usan los créditos",
    "pricing.monthly.sectionTitle": "Paquetes mensuales de créditos",
    "pricing.monthly.sectionLead":
      "Con Lemon Squeezy activo, la suscripción se renueva en cada ciclo de facturación. Elige el nivel que mejor encaje con tu uso.",
    "pricing.monthly.starter.name": "Inicial",
    "pricing.monthly.starter.price": "$7.99",
    "pricing.monthly.starter.credits": "500 créditos / mes",
    "pricing.monthly.starter.desc": "Volumen mensual de entrada.",
    "pricing.monthly.growth.name": "Crecimiento",
    "pricing.monthly.growth.price": "$9.99",
    "pricing.monthly.growth.credits": "1.000 créditos / mes",
    "pricing.monthly.growth.desc": "Uso diario constante.",
    "pricing.monthly.scale.name": "Escala",
    "pricing.monthly.scale.price": "$19.99",
    "pricing.monthly.scale.credits": "5.000 créditos / mes",
    "pricing.monthly.scale.desc": "Alto volumen, automatización y uso mensual intenso.",
    "pricing.yearly.sectionTitle": "Paquetes anuales",
    "pricing.yearly.sectionLead":
      "Los mismos tres niveles que el mensual, facturados una vez al año. Cupo anual: 6.000 / 12.000 / 60.000 créditos (equivalente a 500 / 1.000 / 5.000 al mes).",
    "pricing.yearly.starter.price": "$79 / año",
    "pricing.yearly.starter.credits": "6.000 créditos / año",
    "pricing.yearly.starter.desc": "Equivale al plan Starter mensual con una cuota mensual efectiva menor.",
    "pricing.yearly.starter.savings": "~17 % menos que pagar mensual durante 12 meses",
    "pricing.yearly.growth.price": "$99 / año",
    "pricing.yearly.growth.credits": "12.000 créditos / año",
    "pricing.yearly.growth.desc": "Equivale al Growth mensual — ideal si te comprometes anualmente.",
    "pricing.yearly.growth.savings": "~17 % menos que pagar mensual durante 12 meses",
    "pricing.yearly.scale.price": "$199 / año",
    "pricing.yearly.scale.credits": "60.000 créditos / año",
    "pricing.yearly.scale.desc": "Equivale al Scale mensual — ideal si pagas el año por adelantado y tienes mucho volumen.",
    "pricing.yearly.scale.savings": "~17 % menos que pagar mensual durante 12 meses",
    "pricing.paygo.sectionTitle": "Pago por uso (packs)",
    "pricing.paygo.sectionLead":
      "Créditos puntuales, sin suscripción. Los packs más grandes desbloquean modelos Estándar y Premium.",
    "pricing.paygo.detailModalTitle": "{tier} — detalles de uso",
    "pricing.paygo.infoButtonAria": "Detalles de uso para {tier}",
    "pricing.paygo.closeDetails": "Cerrar",
    "pricing.buyNow": "Comprar",
    "pricing.checkoutFailed": "No se pudo iniciar el pago. Configura las variantes de Lemon Squeezy o inténtalo de nuevo.",
    "pricing.checkoutSignInRequired": "Inicia sesión para comprar una suscripción.",
    "pricing.checkoutProfileRequired":
      "Completa tu perfil de socio antes de comprar; te llevamos allí ahora.",
    "pricing.pack.budget": "10 créditos · $1",
    "pricing.pack.standard": "25 créditos · $1.49",
    "pricing.pack.premium": "50 créditos · $1.99",
    "pricing.allPaygoPacks": "10 créditos · $1 · 25 créditos · $1.49 · 50 créditos · $1.99",
    "pricing.tier.budget": "Económico",
    "pricing.tier.standard": "Estándar",
    "pricing.tier.premium": "Premium",
    "pricing.tier.budgetPrice": "$1",
    "pricing.tier.standardPrice": "$1.49",
    "pricing.tier.premiumPrice": "$1.99",
    "pricing.tier.budgetSummary":
      "Economy y GPT‑4o mini: 1 crédito por bloque de 500 caracteres (redondeo superior).",
    "pricing.tier.standardSummary":
      "Catálogo estándar: 15 créditos por bloque de 500 caracteres (redondeo superior).",
    "pricing.tier.premiumSummary":
      "Catálogo Premium: 25 créditos por bloque de 500 caracteres (redondeo superior).",
    "pricing.tier.budgetDesc":
      "Modelos económicos más GPT‑4o mini (precio Economy): redondeo_superior(caracteres ÷ 500) × 1 crédito. Ej.: 501 caracteres → 2 créditos.",
    "pricing.tier.standardDesc":
      "Banda $1.49: redondeo_superior(caracteres ÷ 500) × 15 créditos. Ej.: 1.000 caracteres → 30 créditos. Los insignia requieren pack Premium.",
    "pricing.tier.premiumDesc":
      "Catálogo insignia completo: redondeo_superior(caracteres ÷ 500) × 25 créditos. Ej.: 1.000 caracteres → 50 créditos. Misma regla de bloques de 500 caracteres que Estándar, con mayor gasto por bloque.",
    "pricing.usageGuide.sectionTitle": "Cómo se usan los créditos (cada generación)",
    "pricing.usageGuide.intro":
      "Cobramos en bloques de 500 caracteres (redondeo superior). Cuenta tu texto pegado más el contexto de la herramienta.",
    "pricing.usageGuide.miniBadge": "Economy y mini",
    "pricing.usageGuide.miniTitle": "GPT‑4o mini y Economy",
    "pricing.usageGuide.miniDesc":
      "1 crédito por bloque. Ej.: 1–500 caracteres → 1 crédito; 501–1.000 → 2 créditos.",
    "pricing.usageGuide.scaleSectionTitle": "Estándar y Premium — créditos por bloque",
    "pricing.usageGuide.standardTitle": "Modelos estándar (ejemplos)",
    "pricing.usageGuide.standardBullets":
      "15 créditos por bloque de 500 caracteres\n~500 caracteres → ~15 créditos\n~1.000 caracteres → ~30 créditos\n~1.500 caracteres → ~45 créditos",
    "pricing.usageGuide.premiumTitle": "Modelos Premium (ejemplos)",
    "pricing.usageGuide.premiumBullets":
      "25 créditos por bloque de 500 caracteres\n~500 caracteres → ~25 créditos\n~1.000 caracteres → ~50 créditos\n~1.500 caracteres → ~75 créditos",
    "pricing.usageGuide.chartCaption": "Ejemplos orientativos",
    "pricing.usageGuide.colShort": "~500 car.",
    "pricing.usageGuide.colMid": "~1k car.",
    "pricing.usageGuide.colLong": "~1,5k car.",
    "pricing.usageGuide.chartHint":
      "Fórmula: redondeo_superior(caracteres ÷ 500) × tarifa del nivel. Las barras son orientativas.",
    "pricing.usageGuide.footer":
      "Al pulsar Generar calculamos los créditos con tu prompt real (texto pegado + contexto). Cada variante alternativa vuelve a aplicar la misma regla.",
    "pricing.modelNote.title": "Modelos por clase",
    "pricing.modelNote.lead":
      "Cada modelo del catálogo pertenece a una clase de facturación (mismos nombres que en el selector de herramientas). Las tarifas de créditos se aplican por clase; tu pack pay-as-you-go puede limitar qué clases puedes elegir.",
    "pricing.modelNote.packHint":
      "Pack $1 → solo Fast AI · Pack $1,49 → Fast + Pro AI · Pack $1,99 → las tres clases (Fast, Pro, Genius).",
    "pricing.sectionFootnote":
      "El límite de versiones sigue tu cuenta. Checkout con Lemon Squeezy (cobros reales cuando la tienda esté en modo live).",
    "pricing.dev.title": "Modo desarrollador",
    "pricing.dev.body": "Añade créditos en local durante el desarrollo (solo no producción):",
    "pricing.dev.secretHint":
      "Si DEV_TOPUP_SECRET está en .env.local, envía la cabecera X-Dev-Topup-Secret o Authorization: Bearer con ese valor.",
    "pricing.dev.disabled": "Este endpoint está desactivado en producción.",

    "pricingModal.title": "Mejora tus créditos",
    "pricingModal.subtitle":
      "Suscripción con 7 días de prueba y créditos de regalo. Si no cancelas antes de que termine, el plan de pago empieza solo. La renovación anual es un único cargo anual. Los créditos se reinician cada periodo.",
    "pricingModal.monthly": "Mensual",
    "pricingModal.yearly": "Anual",
    "pricingModal.closeAria": "Cerrar",
    "pricingModal.plan.basic": "Básico",
    "pricingModal.plan.pro": "Pro",
    "pricingModal.plan.ultra": "Ultra",
    "pricingModal.mostPopular": "Más popular",
    "pricingModal.planCreditsLine": "{credits} créditos / mes tras la prueba (en cada periodo de facturación)",
    "pricingModal.trialGiftLine": "{credits} créditos de regalo durante la prueba de 7 días.",
    "pricingModal.afterTrialNote":
      "Cancela antes de que termine la prueba para no pagar; si no, Lemon Squeezy pasa automáticamente al plan de pago.",
    "pricingModal.yearSingleCharge":
      "Anual tras la prueba: cada renovación es un único cargo de {total} (≈ {perMonth}/mes).",
    "pricingModal.startTrial": "Empezar prueba gratuita de 7 días",
    "pricingModal.thenMonthly": "Luego {price}/mes. Cancela cuando quieras.",
    "pricingModal.thenYearly":
      "Luego ~{price}/mes equivalente (20 % menos en anual). Cancela cuando quieras.",
    "pricingModal.oneTimeTrial": "Prueba única de $1.49 ({credits} créditos)",
    "pricingModal.checkoutFailed": "No se pudo iniciar el pago.",
    "pricingModal.trialAlreadyUsedToast":
      "Ya iniciaste una prueba de suscripción desde este navegador.",
    "pricingModal.oneTimePacksTitle": "Paquetes de crédito de un solo pago",
    "pricingModal.oneTimePacksLead": "Sin suscripción. Pagas una vez; los créditos se añaden al pagar el pedido.",

    "notFound.title": "Página no encontrada",
    "notFound.description": "La página que buscas no existe.",
    "errorPage.title": "Algo salió mal",
    "errorPage.description": "Ocurrió un error inesperado. Reintenta o vuelve al inicio.",
    "errorPage.retry": "Reintentar",
    "errors.serverToast": "Error del servidor. Inténtalo de nuevo en un momento.",
    "errors.generationFailed": "La generación falló.",
    "errors.signInRequired": "Inicia sesión para generar.",
    "errors.noModelResult": "No hubo resultado.",
    "errors.outOfScope": "Esta herramienta no encaja. {reason}",
    "errors.outOfScopeReason.generic": "Elige una herramienta acorde a lo que quieres escribir.",
    "errors.outOfScopeReason.gift":
      "Para preguntar qué regalo quiere alguien o pulir ese mensaje, usa Fijador de texto incómodo.",
    "errors.outOfScopeTryTool": "Herramienta sugerida: {toolName}.",
    "errors.invalidJson": "Solicitud no válida.",
    "errors.invalidPayload": "Entrada de herramienta no válida.",
    "errors.inputTooLong": "La entrada debe tener como máximo {max} caracteres.",
    "errors.extraTooLong": "Las instrucciones extra deben tener como máximo {max} caracteres.",
    "errors.rateLimit": "Demasiadas peticiones. Espera un momento e inténtalo de nuevo.",
    "errors.insufficientCredits":
      "No tienes créditos suficientes para esta generación. Añade créditos o elige un modelo más económico.",
    "errors.insufficientCreditsDetail":
      "Créditos insuficientes. Esta acción requiere {required} créditos; tu saldo es {balance}.",
    "errors.insufficientCreditsAlt": "No hay créditos suficientes para otra versión.",
    "errors.insufficientCreditsAltDetail":
      "Créditos insuficientes para otra versión. Necesitas {required}; saldo {balance}.",
    "errors.aiTemperatureUnsupported":
      "Este modelo no admite ese ajuste. Prueba el nivel Fast o Pro, u otro modelo de la lista.",
    "legal.termsTitle": "Términos del servicio",
    "legal.privacyTitle": "Política de privacidad",
    "legal.effective": "Vigencia: {year}-01-01",
    "legal.termsMetaDescription":
      "Términos del servicio de isendai. Herramientas de escritura con IA, suscripciones y paquetes de créditos.",
    "legal.privacyMetaDescription":
      "Política de privacidad de isendai. Cómo recopilamos, usamos y almacenamos tu texto y datos de cuenta.",
    "legal.paymentsStub":
      "Los packs y suscripciones se venden con Lemon Squeezy. Mientras la revisión del comercio está pendiente, solo checkout test o créditos del operador.",
    "growth.zeroCreditsHint":
      "Saldo 0: usa la recarga dev en Precios (solo local), inicia sesión o pide créditos al administrador.",
    "growth.freeTrial.ctaButton": "Genera tu 1.er mensaje gratis 🎁",
    "growth.freeTrial.modalTitle": "Desbloquea tu primera generación gratis",
    "growth.freeTrial.modalBody":
      "Introduce tu email para desbloquear tu primera generación IA gratis en este dispositivo.",
    "growth.freeTrial.placeholder": "tu@email.com",
    "growth.freeTrial.submit": "Desbloquear y generar",
    "growth.freeTrial.cancel": "Cancelar",
    "growth.freeTrial.invalidEmail": "Introduce un email válido.",
    "growth.freeTrial.deviceAlreadyUsed": "La prueba gratis ya se usó en este dispositivo.",
    "success.pageFallbackTitle": "Resultado",

    "auth.disabled": "Acceso no disponible",
    "auth.disabledTitle":
      "Supabase no está configurado. Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (o SUPABASE_URL y SUPABASE_ANON_KEY) y vuelve a desplegar.",
    "auth.signedInFallback": "Sesión iniciada",
    "login.title": "Acceso",
    "login.subtitle":
      "Entra con email, Google o Facebook. Tras el primer acceso, pedimos un perfil breve de membresía (nombre, país, caso de uso principal).",
    "login.send": "Enviar enlace",
    "login.sending": "Enviando…",
    "login.emailDivider": "O entra con tu email",
    "login.oauthTitle": "Acceso rápido",
    "login.oauthApple": "Apple",
    "login.oauthX": "X (Twitter)",
    "login.oauthLinkedin": "LinkedIn",
    "login.oauthInstagramSub": "Cuenta profesional de Instagram (Meta)",
    "login.oauthTiktok": "TikTok",
    "login.oauthTiktokSub": "Requiere un proveedor OAuth personalizado “tiktok” en Supabase",
    "login.oauthSetupHint":
      "Activa cada proveedor en Supabase → Authentication → Providers. Añade la URL de retorno /auth/callback",
    "login.oauthFailed": "Error al iniciar sesión social.",
    "login.oauthCallbackFailed": "No se pudo completar el acceso. Inténtalo de nuevo o usa email y contraseña.",
    "login.oauthProviderError":
      "El proveedor devolvió un error (cancelado o mal configurado). Revisa las URLs de redirección en Supabase y el cliente OAuth de Google.",
    "login.missingSupabase": "Inicio no configurado (faltan claves de Supabase).",
    "login.membershipEmailTitle": "Email",
    "login.membershipEmailBody":
      "Usa tu email personal: crea una cuenta con contraseña, entra con contraseña o pide un enlace mágico de un solo uso. Después del acceso completas tu perfil de membresía.",
    "login.membershipSocialTitle": "Google o Facebook",
    "login.membershipSocialBody":
      "Inicia sesión con Google o Facebook y confirma o añade los datos de membresía en la siguiente pantalla.",
    "login.membershipGoogleTitle": "Cuenta de Google",
    "login.membershipGoogleBody":
      "Usa tu identidad de Google y confirma o añade los datos de membresía en la siguiente pantalla.",
    "login.membershipFacebookTitle": "Cuenta de Facebook",
    "login.membershipFacebookBody":
      "Usa tu identidad de Facebook y confirma o añade los datos de membresía en la siguiente pantalla.",
    "login.membershipInstagramTitle": "Cuenta de Instagram",
    "login.membershipInstagramBody":
      "Solo cuentas profesionales de Instagram (empresa o creador). Instagram no comparte el correo; completa tu perfil después.",
    "login.oauthInstagram": "Continuar con Instagram",
    "login.oauthInstagramNotConfigured":
      "El inicio con Instagram no está configurado. Añade el proveedor custom:instagram en Supabase (ver README).",
    "login.membershipOtherTitle": "Otros proveedores",
    "login.oauthGoogle": "Continuar con Google",
    "login.oauthFacebook": "Continuar con Facebook",
    "login.oauthOtherTitle": "Más opciones de acceso",
    "login.emailInvalid": "Introduce un email válido.",
    "login.emailSent": "Revisa tu correo para el enlace de acceso.",
    "login.sendFailed": "No se pudo enviar el enlace.",
    "login.emailRateLimit":
      "Demasiados correos en poco tiempo (límite de Supabase). Espera varios minutos e inténtalo de nuevo; en Auth puedes subir límites o usar SMTP propio.",
    "login.emailPlaceholder": "tu@dominio.com",
    "login.passwordPlaceholder": "Contraseña",
    "login.registerButton": "Crear cuenta",
    "login.signInPasswordButton": "Entrar con contraseña",
    "login.passwordTooShort": "La contraseña debe tener al menos 6 caracteres.",
    "login.passwordRequired": "Introduce tu contraseña.",
    "login.confirmEmailSent": "Revisa tu correo para confirmar la cuenta y luego entra.",
    "login.signUpExistingEmail":
      "Es posible que este correo ya esté registrado; no enviamos otro email de confirmación. Entra con tu contraseña o pide el enlace mágico abajo.",
    "login.invalidCredentialsHint":
      "Acceso rechazado: contraseña incorrecta o email sin confirmar. Prueba reenviar confirmación, recuperar contraseña o el enlace mágico abajo.",
    "login.resendConfirmButton": "Reenviar email de confirmación",
    "login.resendConfirmToast":
      "Si el envío funciona, recibirás el correo en breve (revisa también spam).",
    "login.forgotPasswordButton": "¿Olvidaste la contraseña?",
    "login.resetEmailSent": "Revisa tu correo para el enlace de restablecimiento (también spam).",
    "login.updatePasswordTitle": "Nueva contraseña",
    "login.updatePasswordSubtitle":
      "Tu enlace de restablecimiento es válido. Elige una contraseña nueva y continúa a tu cuenta.",
    "login.newPasswordPlaceholder": "Nueva contraseña",
    "login.confirmPasswordPlaceholder": "Confirmar contraseña",
    "login.updatePasswordSubmit": "Guardar contraseña",
    "login.passwordMismatch": "Las contraseñas no coinciden.",
    "login.passwordUpdated": "Contraseña actualizada.",
    "login.authFailed": "No se pudo completar el acceso.",
    "login.magicLinkDivider": "O entrar sin contraseña",
    "login.legalLead": "Al continuar, aceptas nuestros",
    "login.legalMid": "y",
    "login.legalEnd": ".",

    "profile.title": "Perfil de membresía",
    "profile.oauthEmailMissing":
      "Facebook no compartió tu correo. Escríbelo en el campo de abajo y guarda el perfil.",
    "profile.subtitle":
      "Estos datos se guardan en tu cuenta (metadatos de usuario en Supabase) para soporte y comunicación del producto.",
    "profile.backToAccount": "Volver a mi cuenta",
    "profile.editLink": "Datos de membresía",
    "profile.emailLabel": "Email de la cuenta",
    "profile.emailPlaceholder": "tu@ejemplo.com",
    "profile.emailHintOAuth":
      "Facebook no compartió tu correo. Escríbelo aquí — lo guardaremos en tu cuenta.",
    "profile.emailConfirmSent":
      "Enviamos un enlace de confirmación a esa dirección. Ábrelo y vuelve aquí si hace falta.",
    "profile.fullName": "Nombre completo",
    "profile.phone": "Teléfono (opcional)",
    "profile.country": "País o región",
    "profile.countryPlaceholder": "Selecciona un país…",
    "profile.addressLabel": "Dirección (opcional)",
    "profile.addressPlaceholder": "Calle, número, piso, barrio…",
    "profile.cityLabel": "Ciudad (opcional)",
    "profile.organization": "Empresa o centro (opcional)",
    "profile.jobTitle": "Puesto o título (opcional)",
    "profile.useCase": "Caso de uso principal",
    "profile.useCasePlaceholder": "Elige uno…",
    "profile.useCaseWork": "Trabajo y carrera",
    "profile.useCasePersonal": "Gestión personal",
    "profile.useCaseCreator": "Creador / redes",
    "profile.useCaseStudent": "Estudiante / académico",
    "profile.useCaseAgency": "Agencia / clientes",
    "profile.useCaseOther": "Otro",
    "profile.defaultAiModel": "Versión de IA predeterminada",
    "profile.defaultAiModelHint":
      "Se preselecciona al abrir una herramienta. Puedes cambiarla en cada pregunta; tu última elección se guarda en este dispositivo.",
    "profile.notes": "¿Algo más que debamos saber? (opcional)",
    "profile.notesPlaceholder": "Contexto, objetivos, idiomas…",
    "profile.marketingOptIn": "Envíame correos ocasionales sobre novedades (opcional).",
    "profile.acceptTerms":
      "Confirmo que la información es correcta y acepto los Términos y la Política de privacidad.",
    "profile.save": "Guardar y continuar",
    "profile.saving": "Guardando…",
    "profile.saved": "Perfil guardado.",
    "profile.errors.required": "Completa todos los campos obligatorios.",
    "profile.errors.emailRequired": "Introduce tu dirección de correo.",
    "profile.errors.emailInvalid": "Introduce un correo válido.",
    "profile.errors.terms": "Debes aceptar los términos para continuar.",
    "profile.errors.save": "No se pudo guardar el perfil. Inténtalo de nuevo.",

    "tool.flow.hint":
      "A continuación abrimos la página de resultado y generamos con tu saldo. ¿Necesitas más créditos? Ve a Precios y paga con Lemon Squeezy.",
    "tool.modelSelectLabel": "Modelo de IA para esta solicitud",
    "tool.ctaCreditSuffix": " — según modelo y longitud",
    "tool.priceReference": "Paquete de pago por uso para este nivel: {pack}.",
    "tool.pricePackFlex":
      "Todos los paquetes: 10 créditos · $1 · 25 créditos · $1.49 · 50 créditos · $1.99. Ver Precios para el cálculo de créditos.",
    "tool.validation.empty": "Completa los campos obligatorios antes de continuar.",
    "tool.billing.creditOne": "1 crédito",
    "tool.billing.creditsMany": "{n} créditos",
    "tool.billing.paidButton": "{action} · {amount}",

    "errors.toolParamMissing": "Falta el parámetro de herramienta o no es válido.",
    "errors.noSavedInput":
      "No se encontró entrada guardada en localStorage para esta herramienta. Vuelve atrás e inténtalo de nuevo.",
    "errors.savedInputParse":
      "No se pudo leer la entrada guardada. Vuelve atrás e inténtalo de nuevo.",
    "errors.savedInputMismatch":
      "La entrada guardada no coincide con la herramienta solicitada. Vuelve atrás e inténtalo de nuevo.",
    "errors.savedInputInvalid":
      "La entrada guardada está incompleta para esta herramienta. Vuelve atrás y añade más detalles.",

    "tool.corporate-whisperer.title": "El Susurrador Corporativo",
    "tool.coverletter-ai.title": "Carta de Presentación en 1 Click",
    "tool.dating-roast.title": "Roast y Mejora de Perfil",
    "tool.raise-negotiator.title": "Negociador de Aumento",
    "tool.graceful-quitter.title": "Renuncia con Clase",
    "tool.cold-dm-icebreaker.title": "Rompehielos para DM",
    "tool.micromanager-tamer.title": "Domador de Micromanagers",
    "tool.invoice-chaser.title": "Cobrador de Facturas",
    "tool.perfect-apology.title": "La Disculpa Perfecta",
    "tool.refund-demander.title": "Reclamador de Reembolso",
    "tool.deadline-diplomat.title": "Diplomático de Plazos",
    "tool.landlord-diplomat.title": "Diplomático con el Casero",
    "tool.review-retaliator.title": "Respuesta a Reseñas",
    "tool.ghosting-resurrector.title": "Resucitador de Ghosting",
    "tool.passive-aggressive-decoder.title": "Decodificador Pasivo‑Agresivo",
    "tool.guilt-free-no.title": 'El "No" sin Culpa',
    "tool.delicate-truth.title": "La Verdad Delicada",
    "tool.co-parenting-peacemaker.title": "Pacificador de Coparentalidad",
    "tool.friendzone-navigator.title": "Navegador de Friendzone",
    "tool.rsvp-diplomat.title": "Diplomático de RSVP",

    "tool.insurance-claim-letter.title": "Carta de Reclamación al Seguro",
    "tool.insurance-claim-letter.desc":
      "Redacta una carta de reclamación clara con hechos, fechas y la cobertura solicitada.",

    "tool.linkedin-headline-smith.title": "Herrero de titulares de LinkedIn",

    "tool.corporate-to-caveman-translator.title": "Traductor de corporate a cavernícola",
    "tool.corporate-to-caveman-translator.desc":
      "Pega un correo corporativo largo y aburrido. Lo traducimos a la verdad primitiva brutal, en pocas palabras.",
  },
  fr: {
    "brand.name": "isendai",
    "header.theme": "Changer le thème",
    "socialProof.demoPrefix": "Démo :",
    "hero.kicker": "Brouillon chaotique → message prêt à envoyer ✨",
    "hero.title": "N’envoyez pas encore. Corrigez d’abord.",
    "hero.subtitle":
      "Mail rageux ? SMS gênant ? Lettre bancale ? Collez le chaos. Repartez avec un message que vous oseriez envoyer — en quelques secondes.",
    "hero.cta": "Corriger mon bazar (1er essai offert 🎁)",
    "hero.modulusFamily": "Une offre de la famille MODULUS —",
    "hero.badge.noSubscription": "Pas de piège d’abonnement",
    "hero.badge.noSignups": "Essai gratuit dispo",
    "hero.badge.payPerUse": "Payez à la génération",
    "promo.isend101.ariaLabel": "Offre à durée limitée",
    "promo.isend101.badge": "Offre à durée limitée",
    "promo.isend101.title": "−50 % — lâchez-vous, payez moins 🔥",
    "promo.isend101.body":
      "Code {code} au paiement — {percent} % de réduction sur tout forfait ou pack pour une durée limitée.",
    "promo.isend101.hint": "Saisissez le code sur la page de paiement Lemon Squeezy avant de régler.",
    "promo.isend101.codeLabel": "Votre code",
    "promo.isend101.copy": "Copier le code",
    "promo.isend101.copied": "Code copié.",
    "promo.isend101.copiedShort": "Copié",
    "promo.isend101.copyFailed": "Copie impossible — sélectionnez le code manuellement.",
    "promo.isend101.viewPricing": "Voir forfaits et packs",
    "hero.badge.noStore": "Nous ne stockons pas votre texte",

    "home.demo.before.label": "Avant",
    "home.demo.after.label": "Après",
    "home.demo.title": "Avant / Après",
    "home.demo.subtitle":
      "Choisissez un produit, voyez la transformation, puis cliquez pour générer le vôtre.",
    "home.demo.examples.corp.before":
      "Ce design est nul, vous n’avez clairement pas lu mon brief !",
    "home.demo.examples.corp.after":
      "J’ai l’impression qu’on s’est un peu éloignés du brief initial. Pourrions-nous revoir le design pour qu’il colle mieux à notre vision d’origine ?",
    "home.demo.examples.quit.before":
      "J’en ai marre. Je démissionne. Ne me contactez plus.",
    "home.demo.examples.quit.after":
      "Bonjour [Nom] — je vous informe de ma démission effective le [date]. Merci pour l’opportunité. Je faciliterai la transition et laisserai une documentation avant mon départ.",
    "home.demo.examples.gift.before":
      "Je veux t’offrir un cadeau mais je n’ai aucune idée. Dis‑moi ce que tu veux.",
    "home.demo.examples.gift.after":
      "J’aimerais te faire une surprise que tu apprécieras vraiment. S’il y a une chose dont tu as envie en ce moment, ce serait quoi ?",
    "home.demo.examples.caveman.before":
      "On en reparle hors‑ligne et on y revient la semaine prochaine.",
    "home.demo.examples.caveman.after":
      "J’aime pas. Plus tard.",

    "section.tools.title": "Choisissez un outil. Collez votre texte. Améliorez instantanément.",
    "section.tools.subtitle":
      "Pour la vraie vie : emails pro, candidatures, bios de rencontre.",
    "tabs.corporate": "Corporate",
    "tabs.coverletter": "Lettre",
    "tabs.dating": "Bio",
    "how.title": "Comment ça marche",
    "how.1.title": "1) Collez",
    "how.1.body": "Collez votre brouillon, offre ou bio. Sans mise en forme.",
    "how.2.title": "2) Améliorez",
    "how.2.body": "L’IA réécrit avec meilleur ton, structure et clarté.",
    "how.3.title": "3) Copiez & envoyez",
    "how.3.body": "Résultat propre avec copie en un clic.",

    "how.detailed.title": "Comment ça marche (4 étapes simples)",
    "how.detailed.subtitle":
      "Transformez vos idées en vrac en messages parfaits en moins de 10 secondes.",
    "how.detailed.1.title": "1) Choisissez votre outil",
    "how.detailed.1.body":
      "Parcourez nos micro‑outils dans le menu ou demandez à l’AI Concierge de trouver le bon pour votre situation.",
    "how.detailed.2.title": "2) Collez votre brouillon",
    "how.detailed.2.body":
      "Collez votre e‑mail énervé, SMS maladroit ou notes brutes. Pas besoin de corriger : videz votre sac.",
    "how.detailed.3.title": "3) Choisissez votre puissance IA",
    "how.detailed.3.body":
      "Optez pour 'Fast AI' (1 crédit) pour des retouches rapides ou 'Pro AI' (25 crédits) pour les messages importants. Le coût exact est toujours affiché sur le bouton.",
    "how.detailed.4.title": "4) Peaufinez et envoyez",
    "how.detailed.4.body":
      "Relisez le résultat, copiez‑le ou demandez une autre variante. Envoyez en toute confiance.",
    "products.title": "Produits (rapides, efficaces)",
    "products.subtitle": "Des outils simples : mieux écrire, plus vite.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Ferme. Sûr. Pro.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "Sur-mesure, ATS, prêt entretien.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Moins cringe. Plus de matchs.",
    "faq.q1": "Stockez-vous mon texte ?",
    "faq.a1": "Non. Il reste dans votre navigateur (localStorage) pour terminer le flux.",
    "faq.q2": "Comment fonctionne le paiement ?",
    "faq.a2": "Paiement à l’usage. Paiement sécurisé via Lemon Squeezy. Pas de pièges.",
    "faq.q3": "Qu’est-ce que je reçois ?",
    "faq.a3": "Un texte peaufiné que vous pouvez copier immédiatement.",
    "footer.copyright": "© 2026 isendai.com. Conçu pour mieux communiquer.",
    "footer.modulusLead": "Une offre de la famille MODULUS —",
    "footer.modulus": "Site corporate MODULUS",
    "footer.trust":
      "🔒 Paiements sécurisés via Lemon Squeezy | ⚡ Propulsé par l’IA | 🚫 Nous ne stockons pas vos données.",
    "tool.corp.desc":
      "Envie de crier sur votre boss ou client ? Ne le faites pas. Écrivez tout, on le transforme en email poli et OK RH.",
    "tool.corp.placeholder":
      `Tapez ce que vous voulez VRAIMENT dire... (ex. "Ce design est nul et vous n’avez pas lu le brief.")`,
    "tool.corp.button": "Traduire en pro",
    "tool.action.generic": "Générer",
    "tool.placeholder.generic": "Collez votre texte ici…",
    "tool.cover.desc":
      "Marre de la même lettre ? Collez l’URL/offre et vos compétences. On génère une lettre ciblée qui décroche des entretiens.",
    "tool.cover.placeholder1": "Collez l’offre ou l’URL...",
    "tool.cover.placeholder2": "Collez votre CV ou compétences clés...",
    "tool.cover.button": "Générer la lettre",
    "tool.dating.desc":
      "Pas assez de matchs ? L’IA roast votre bio, explique pourquoi ça bloque, puis écrit une nouvelle bio magnétique.",
    "tool.dating.placeholder": "Collez votre bio Tinder/Bumble ou décrivez votre vibe...",
    "tool.dating.button": "Roast & corriger",
    "success.test": "Mode test. Génération…",
    "success.paid": "Paiement reçu. Génération…",
    "success.introCredits":
      "Des crédits sont prélevés selon le modèle et la longueur du texte (tranches de 500 caractères).",
    "success.insufficientFallback": "Crédits insuffisants pour lancer la génération.",
    "success.insufficientTitle": "Plus de crédits",
    "success.insufficientBody":
      "Voir Tarifs pour les packs et recharges. En local, suis les notes de recharge dev sur cette page, connecte-toi ou demande des crédits à l’admin.",
    "success.usingSaved": "Nous utilisons votre texte sauvegardé (localStorage).",
    "success.generating": "Génération…",
    "success.copy": "Copier",
    "success.shareOnX": "Partager sur X",
    "success.shareOnXAria": "Partager ce résultat sur X",
    "success.downloadSocial": "Télécharger pour IG/TikTok",
    "success.downloadSocialAria": "Télécharger l’image pour Instagram ou TikTok",
    "success.downloadSocialToast": "Image téléchargée — prêt à publier !",
    "success.downloadSocialFailed": "Impossible de créer l’image.",
    "success.shareOnLinkedIn": "Partager sur LinkedIn",
    "success.shareOnLinkedInAria": "Partager ce résultat sur LinkedIn",
    "success.shareLinkedInToast":
      "Texte copié ! Collez-le dans votre publication LinkedIn.",
    "success.shareLinkedInCopyFailed":
      "Impossible de copier dans le presse-papiers. Copiez le texte manuellement.",
    "success.yourQuestion": "Votre question",
    "success.aiAnswer": "Réponse de l’IA",
    "success.shareToolbarAria": "Partager ce résultat",
    "success.shareOnFacebook": "Partager sur Facebook",
    "success.shareOnFacebookAria": "Partager ce résultat sur Facebook",
    "success.shareFacebookToast":
      "Texte copié ! Collez-le dans votre publication Facebook.",
    "success.shareOnInstagram": "Partager sur Instagram",
    "success.shareOnInstagramAria": "Partager ce résultat sur Instagram",
    "success.shareInstagramToast":
      "Texte copié ! Collez-le dans la légende Instagram.",
    "success.shareOnTikTok": "Partager sur TikTok",
    "success.shareOnTikTokAria": "Partager ce résultat sur TikTok",
    "success.shareTikTokToast":
      "Texte copié ! Collez-le dans la description TikTok.",
    "success.shareCopyFailed":
      "Impossible de copier dans le presse-papiers. Copiez le texte manuellement.",
    "success.ready": "Quand vous voulez.",

    "success.ephemeral.title": "Info",
    "success.ephemeral.body":
      "Ces résultats sont temporaires. Si vous fermez cet onglet/cette fenêtre, ils seront supprimés et vous ne pourrez plus y accéder.",
    "success.alt.generate": "Générer une alternative",
    "success.alt.panelTitle": "Créer une autre version",
    "success.alt.modelLabel": "Version IA pour cette alternative",
    "success.alt.limit": "Vous avez atteint le maximum de 5 alternatives pour cette génération.",
    "success.alt.version": "Version",
    "success.alt.extra.label": "Consignes supplémentaires pour la prochaine version (optionnel)",
    "success.alt.extra.placeholder":
      "ex. plus humain, un peu drôle, plus court, plus formel, plus chaleureux, etc.",
    "success.versions": "Versions enregistrées :",
    "success.selectedVersion": "Version sélectionnée :",
    "success.feedback.question": "Comment l’IA s’en est-elle sortie ?",
    "success.feedback.thanks": "Merci d’aider notre IA à évoluer ! ✨",
    "success.feedback.thumbsUpAria": "Bon résultat",
    "success.feedback.thumbsDownAria": "Mauvais résultat",

    "home.sidebar.title": "Produits IA",
    "home.workspace.hint": "Coller → Générer → Copier",
    "home.aiStack.title": "Les Principaux Modèles d'IA au Monde, Réunis 🧠",
    "home.aiStack.body":
      "En coulisses, les cerveaux de géants comme OpenAI (ChatGPT), Anthropic (Claude), Google et DeepSeek travaillent pour vous. Vous ne voulez pas choisir un modèle ? Laissez le mode « Auto » : nous sélectionnons le plus adapté à votre situation. Ou reprenez le contrôle et choisissez votre intelligence dans le menu ! (La consommation de crédits est calculée de façon transparente selon le niveau du modèle choisi).",
    "home.expertBots.kicker": "Bots experts par sujet",
    "home.expertBots.title": "Pas un seul chatbot — un spécialiste pour chaque sujet",
    "home.expertBots.lead":
      "isendai est conçu comme une flotte de bots experts, pas un assistant générique. Chaque outil est calibré pour sa niche—email pro, lettres, dating, SOW freelance, paperasse, voisins, créateurs, famille—avec prompts dédiés, contrôle de périmètre et routage intelligent vers le meilleur modèle.",
    "home.expertBots.point1":
      "Bots par domaine : plus de 80 micro-outils dans huit univers de vie, chacun avec son persona et son format.",
    "home.expertBots.point2":
      "Moteur multi-fournisseurs : OpenAI, Anthropic, Gemini, Groq et DeepSeek—auto ou choix manuel dans un menu.",
    "home.expertBots.point3":
      "Stack production : garde-fous de scope, crédits transparents, historique de versions et réponses dans votre langue.",

    "category.work-career.label": "Boost Carrière",
    "category.crisis-money.label": "SOS Argent",
    "category.social-dating.label": "Amis & Crushs",
    "category.freelance-business.label": "Freelance Boost",
    "category.academic-bureaucracy.label": "Paperasse Zen",
    "category.neighbors-living.label": "Maison Harmonie",
    "category.creators-media.label": "Studio Créateur",
    "category.family-deep-personal.label": "Cœur à Cœur",

    "concierge.title": "ISENDAI",
    "concierge.welcome":
      "Bonjour — de quoi avez-vous besoin aujourd’hui ? (ex. un email pro, une lettre de motivation, une demande de remboursement, une bio de rencontre)",
    "concierge.placeholder": "Dites-moi ce que vous cherchez à faire…",
    "concierge.send": "Envoyer",
    "concierge.thinking": "Réflexion…",
    "concierge.modelLabel": "Modèle IA pour les réponses",
    "concierge.offScope.lead":
      "Nous pouvons t’aider avec les outils d’écriture isendai—par exemple un message plus naturel pour demander quel cadeau la personne veut.",
    "concierge.offScope.try": "Essaie ces outils :",
    "concierge.errors.chatFailed": "Échec du chat. Réessaie.",
    "concierge.errors.noReply": "Aucune réponse de l’assistant.",
    "concierge.errors.invalidBody": "Requête de chat invalide.",
    "concierge.errors.missingApi": "Concierge non configuré.",
    "concierge.errors.invalidModel": "Modèle IA invalide.",
    "concierge.errors.missingProvider": "Fournisseur IA non configuré.",
    "concierge.errors.aiFailed": "Impossible d’obtenir une réponse. Réessaie.",
    "concierge.errors.server": "Erreur serveur. Réessaie dans un instant.",
    "concierge.errors.authRequired": "Connecte-toi pour utiliser le chat assistant.",

    "deploy.stagingBanner":
      "Environnement de staging — pas le site en production. Teste ici avant de fusionner vers main.",
    "deploy.stagingOpenProduction": "Ouvrir la production (isendai.com)",

    "nav.backToHome": "Retour à l’accueil",
    "nav.pricing": "Tarifs",
    "nav.privacy": "Confidentialité",
    "nav.terms": "Conditions",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "legal.contact.lead": "Questions ? Écrivez à",
    "announce.newModel.badge": "Nouveau",
    "announce.newModel.title": "{model} est là",
    "announce.newModel.body": "Notre niveau {tier} tourne désormais sur {model} : des résultats plus nets et fiables, au même prix en crédits.",
    "announce.dismiss": "Compris",
    "contact.title": "Contact",
    "contact.lead": "Questions sur la facturation, votre compte ou le produit ? Écrivez-nous ou envoyez un e-mail à",
    "contact.nameLabel": "Nom",
    "contact.emailLabel": "E-mail",
    "contact.subjectLabel": "Objet (facultatif)",
    "contact.messageLabel": "Message",
    "contact.submit": "Envoyer",
    "contact.sending": "Envoi…",
    "contact.successToast": "Message envoyé — nous vous répondrons bientôt.",
    "contact.successBody": "Merci ! Message reçu. Réponse habituelle sous un jour ouvré.",
    "contact.errors.send": "Échec de l’envoi. Réessayez ou écrivez au support.",
    "nav.login": "Connexion · Compte",
    "nav.history": "Historique",
    "nav.account": "Mon compte",
    "nav.logout": "Se déconnecter",

    "creditsNav.title": "Solde de crédits",
    "creditsNav.unit": "Crédits",
    "creditsNav.trialOne": "Essai : il reste 1 jour",
    "creditsNav.trialMany": "Essai : il reste {days} jours",

    "modelSwitcher.ariaLabel": "Version du modèle IA",
    "modelSwitcher.fast": "Fast AI (1 crédit)",
    "modelSwitcher.pro": "Pro AI (15 crédits)",
    "modelSwitcher.genius": "Genius AI (25 crédits)",
    "modelSwitcher.auto": "Auto (l’outil choisit le fournisseur)",
    "modelSwitcher.quickTiers": "Niveaux rapides",
    "modelSwitcher.providerOpenai": "OpenAI",
    "modelSwitcher.providerAnthropic": "Anthropic",
    "modelSwitcher.providerGoogle": "Google Gemini",
    "modelSwitcher.providerGroq": "Groq",
    "modelSwitcher.providerDeepseek": "DeepSeek",

    "usage.creditsHeading": "Crédits",
    "usage.versionsLine": "Versions par génération : {max}",
    "usage.requestsHeading": "Générations",
    "usage.open": "Ouvrir",
    "usage.rerun": "Relancer",
    "usage.modelLabel": "Modèle",
    "usage.chargedLine": "Crédits utilisés : {charged} · Max versions : {max}",
    "usage.emptyRequests": "Aucune génération pour l’instant.",
    "history.title": "Historique",
    "history.subtitleUser": "Demandes sur ton compte",
    "account.pageTitle": "Compte",
    "account.recentRequests": "Générations récentes",
    "request.pageTitle": "Demande",
    "request.timeCreditsLine":
      "{date} · Crédits utilisés : {charged} · Max versions : {max}",
    "request.inputStored": "Entrée enregistrée",
    "request.versions": "Versions",
    "request.versionLine": "Version {idx}",
    "request.noVersions": "Aucune version enregistrée pour l’instant.",
    "home.creditsSummary": "Crédits : {credits} · Versions par génération : {max} · {scope}",
    "home.creditsScopeUser": "Connecté",
    "ui.copy": "Copier",
    "ui.copying": "En cours…",
    "ui.copied": "Copié.",
    "ui.copySuccessToast": "Copié dans le presse-papiers ! 📋",
    "ui.copyFailed": "Impossible de copier.",

    "billing.lemon.pendingReview":
      "Paiements : examen Lemon en cours. Checkout en test jusqu’à approbation. Crédits ? Recharge dev staging ou info@modulustech.app / Contact.",
    "billing.lemon.testMode":
      "Paiements : Lemon Squeezy en mode test. Cartes de test au checkout ; le live exige le mode live Lemon + Netlify.",
    "billing.lemon.unconfigured":
      "Paiements : Lemon Squeezy non configuré sur ce déploiement. Variables LEMON_SQUEEZY_* ou recharge dev staging.",
    "pricing.title": "Tarifs",
    "pricing.subtitle":
      "Forfaits dès 7,99 $/mois, annuel ~17 % moins cher, ou à l’usage dès 1 $. Entrée de gamme et GPT‑4o mini : 1 crédit par 500 caractères ; Standard 15 ; Premium 25 (par bloc, arrondi supérieur).",
    "pricing.hero.intro": "Trois façons de charger des crédits — mêmes règles partout :",
    "pricing.hero.tagMonthly": "Mensuel",
    "pricing.hero.tagAnnual": "Annuel",
    "pricing.hero.annualSaveBadge": "~17 %",
    "pricing.hero.tagPaygo": "À l’usage",
    "pricing.hero.paygoHint": "Les packs plus grands ouvrent plus de modèles.",
    "pricing.hero.footerMain":
      "Entrée de gamme et GPT‑4o mini : 1 crédit par bloc de 500 caractères. Standard : 15 ; Premium : 25 — chaque bloc supplémentaire s’ajoute.",
    "pricing.hero.footerJump": "Utilisation des crédits",
    "pricing.monthly.sectionTitle": "Forfaits mensuels de crédits",
    "pricing.monthly.sectionLead":
      "Une fois Lemon Squeezy activé, l’abonnement se renouvelle à chaque période de facturation. Choisis le palier (Starter, Croissance, Échelle) adapté à ton usage.",
    "pricing.monthly.starter.name": "Starter",
    "pricing.monthly.starter.price": "7,99 $",
    "pricing.monthly.starter.credits": "500 crédits / mois",
    "pricing.monthly.starter.desc": "Volume mensuel d’entrée.",
    "pricing.monthly.growth.name": "Croissance",
    "pricing.monthly.growth.price": "9,99 $",
    "pricing.monthly.growth.credits": "1 000 crédits / mois",
    "pricing.monthly.growth.desc": "Usage quotidien régulier.",
    "pricing.monthly.scale.name": "Échelle",
    "pricing.monthly.scale.price": "19,99 $",
    "pricing.monthly.scale.credits": "5 000 crédits / mois",
    "pricing.monthly.scale.desc": "Gros volumes et automatisation.",
    "pricing.yearly.sectionTitle": "Forfaits annuels",
    "pricing.yearly.sectionLead":
      "Les trois mêmes niveaux qu’en mensuel, facturés une fois par an. Enveloppe annuelle : 6 000 / 12 000 / 60 000 crédits (équivalent à 500 / 1 000 / 5 000 par mois).",
    "pricing.yearly.starter.price": "79 $ / an",
    "pricing.yearly.starter.credits": "6 000 crédits / an",
    "pricing.yearly.starter.desc": "Équivalent au Starter mensuel avec un coût mensuel effectif plus bas.",
    "pricing.yearly.starter.savings": "~17 % de moins que 12 mois au tarif mensuel",
    "pricing.yearly.growth.price": "99 $ / an",
    "pricing.yearly.growth.credits": "12 000 crédits / an",
    "pricing.yearly.growth.desc": "Équivalent au Growth mensuel — idéal si vous vous engagez sur l’année.",
    "pricing.yearly.growth.savings": "~17 % de moins que 12 mois au tarif mensuel",
    "pricing.yearly.scale.price": "199 $ / an",
    "pricing.yearly.scale.credits": "60 000 crédits / an",
    "pricing.yearly.scale.desc": "Équivalent au Scale mensuel — le plus adapté en paiement annuel si ton volume est élevé.",
    "pricing.yearly.scale.savings": "~17 % de moins que 12 mois au tarif mensuel",
    "pricing.paygo.sectionTitle": "Paiement à l’usage (packs)",
    "pricing.paygo.sectionLead":
      "Recharge ponctuelle, sans abonnement. Les packs plus grands débloquent les modèles Standard et Premium.",
    "pricing.paygo.detailModalTitle": "{tier} — détails d’utilisation",
    "pricing.paygo.infoButtonAria": "Détails d’utilisation pour {tier}",
    "pricing.paygo.closeDetails": "Fermer",
    "pricing.buyNow": "Acheter",
    "pricing.checkoutFailed": "Impossible de démarrer le paiement. Configure les variantes Lemon Squeezy ou réessaie.",
    "pricing.checkoutSignInRequired": "Connecte-toi pour acheter un abonnement.",
    "pricing.checkoutProfileRequired":
      "Complète ton profil membre avant d’acheter — redirection en cours.",
    "pricing.pack.budget": "10 crédits · 1 $",
    "pricing.pack.standard": "25 crédits · 1,49 $",
    "pricing.pack.premium": "50 crédits · 1,99 $",
    "pricing.allPaygoPacks": "10 crédits · 1 $ · 25 crédits · 1,49 $ · 50 crédits · 1,99 $",
    "pricing.tier.budget": "Économique",
    "pricing.tier.standard": "Standard",
    "pricing.tier.premium": "Premium",
    "pricing.tier.budgetPrice": "1 $",
    "pricing.tier.standardPrice": "1,49 $",
    "pricing.tier.premiumPrice": "1,99 $",
    "pricing.tier.budgetSummary":
      "Entrée de gamme et GPT‑4o mini : 1 crédit par bloc de 500 caractères (arrondi supérieur).",
    "pricing.tier.standardSummary":
      "Catalogue Standard : 15 crédits par bloc de 500 caractères (arrondi supérieur).",
    "pricing.tier.premiumSummary":
      "Catalogue Premium : 25 crédits par bloc de 500 caractères (arrondi supérieur).",
    "pricing.tier.budgetDesc":
      "Modèles entrée de gamme plus GPT‑4o mini (tarif entrée de gamme) : arrondi_supérieur(caractères ÷ 500) × 1 crédit. Ex. : 501 caractères → 2 crédits.",
    "pricing.tier.standardDesc":
      "Palier $1,49 : arrondi_supérieur(caractères ÷ 500) × 15 crédits. Ex. : 1 000 caractères → 30 crédits. Les phares nécessitent un pack Premium.",
    "pricing.tier.premiumDesc":
      "Catalogue phares : arrondi_supérieur(caractères ÷ 500) × 25 crédits. Ex. : 1 000 caractères → 50 crédits. Même règle de blocs de 500 caractères que Standard, avec un coût en crédits plus élevé par bloc.",
    "pricing.usageGuide.sectionTitle": "Comment les crédits sont utilisés (chaque génération)",
    "pricing.usageGuide.intro":
      "Facturation par blocs de 500 caractères (arrondi supérieur). Votre collage et le contexte de l’outil comptent dans la longueur.",
    "pricing.usageGuide.miniBadge": "Entrée de gamme & mini",
    "pricing.usageGuide.miniTitle": "GPT‑4o mini et entrée de gamme",
    "pricing.usageGuide.miniDesc":
      "1 crédit par bloc. Ex. : 1–500 caractères → 1 crédit ; 501–1 000 → 2 crédits.",
    "pricing.usageGuide.scaleSectionTitle": "Standard et Premium — crédits par bloc",
    "pricing.usageGuide.standardTitle": "Modèles Standard (exemples)",
    "pricing.usageGuide.standardBullets":
      "15 crédits par bloc de 500 caractères\n~500 caractères → ~15 crédits\n~1 000 caractères → ~30 crédits\n~1 500 caractères → ~45 crédits",
    "pricing.usageGuide.premiumTitle": "Modèles Premium (exemples)",
    "pricing.usageGuide.premiumBullets":
      "25 crédits par bloc de 500 caractères\n~500 caractères → ~25 crédits\n~1 000 caractères → ~50 crédits\n~1 500 caractères → ~75 crédits",
    "pricing.usageGuide.chartCaption": "Exemples indicatifs",
    "pricing.usageGuide.colShort": "~500 car.",
    "pricing.usageGuide.colMid": "~1k car.",
    "pricing.usageGuide.colLong": "~1,5k car.",
    "pricing.usageGuide.chartHint":
      "Formule : arrondi_supérieur(caractères ÷ 500) × tarif du palier. Les barres sont indicatives.",
    "pricing.usageGuide.footer":
      "Au clic sur Générer, le montant est calculé sur votre prompt réel (collage + contexte). Chaque variante refait le même calcul.",
    "pricing.modelNote.title": "Modèles par classe",
    "pricing.modelNote.lead":
      "Chaque modèle du catalogue appartient à une classe de facturation (mêmes noms que dans le sélecteur d’outil). Les tarifs de crédits s’appliquent par classe ; votre pack à l’usage peut limiter les classes disponibles.",
    "pricing.modelNote.packHint":
      "Pack 1 $ → Fast AI seulement · Pack 1,49 $ → Fast + Pro AI · Pack 1,99 $ → les trois classes (Fast, Pro, Genius).",
    "pricing.sectionFootnote":
      "La limite de versions suit ton compte. Checkout via Lemon Squeezy (prélèvements live quand la boutique est approuvée).",
    "pricing.dev.title": "Mode développeur",
    "pricing.dev.body": "Ajoute des crédits en local pendant le développement (hors production) :",
    "pricing.dev.secretHint":
      "Si DEV_TOPUP_SECRET est défini dans .env.local, envoie l’en-tête X-Dev-Topup-Secret ou Authorization: Bearer avec cette valeur.",
    "pricing.dev.disabled": "Ce point de terminaison est désactivé en production.",

    "pricingModal.title": "Augmenter tes crédits",
    "pricingModal.subtitle":
      "Abonnement avec 7 jours d’essai et crédits bonus. Sans annulation avant la fin, l’abonnement payant démarre tout seul. L’annuel se facture en un seul paiement par renouvellement. Crédits remis à zéro chaque cycle.",
    "pricingModal.monthly": "Mensuel",
    "pricingModal.yearly": "Annuel",
    "pricingModal.closeAria": "Fermer",
    "pricingModal.plan.basic": "Basique",
    "pricingModal.plan.pro": "Pro",
    "pricingModal.plan.ultra": "Ultra",
    "pricingModal.mostPopular": "Le plus populaire",
    "pricingModal.planCreditsLine": "{credits} crédits / mois après l’essai (chaque période de facturation)",
    "pricingModal.trialGiftLine": "{credits} crédits bonus pendant les 7 jours d’essai.",
    "pricingModal.afterTrialNote":
      "Annule avant la fin de l’essai pour ne pas être débité·e ; sinon Lemon Squeezy enchaîne sur le plan payant.",
    "pricingModal.yearSingleCharge":
      "Annuel après essai : chaque renouvellement = un paiement unique de {total} (≈ {perMonth}/mois).",
    "pricingModal.startTrial": "Démarrer l’essai gratuit 7 jours",
    "pricingModal.thenMonthly": "Puis {price}/mois. Annule quand tu veux.",
    "pricingModal.thenYearly":
      "Puis ~{price}/mois équivalent (-20 % sur l’annuel). Annule quand tu veux.",
    "pricingModal.oneTimeTrial": "Essai unique à $1.49 ({credits} crédits)",
    "pricingModal.checkoutFailed": "Impossible de démarrer le paiement.",
    "pricingModal.trialAlreadyUsedToast":
      "Tu as déjà commencé un essai d’abonnement depuis ce navigateur.",
    "pricingModal.oneTimePacksTitle": "Packs de crédits ponctuels",
    "pricingModal.oneTimePacksLead": "Sans abonnement. Un seul paiement — les crédits sont ajoutés quand la commande est payée.",

    "notFound.title": "Page introuvable",
    "notFound.description": "La page demandée n’existe pas.",
    "errorPage.title": "Une erreur s’est produite",
    "errorPage.description": "Erreur inattendue. Réessayez ou retournez à l’accueil.",
    "errorPage.retry": "Réessayer",
    "errors.serverToast": "Erreur serveur. Réessaie dans un instant.",
    "errors.generationFailed": "Échec de la génération.",
    "errors.signInRequired": "Connectez-vous pour générer.",
    "errors.noModelResult": "Aucun résultat renvoyé.",
    "errors.outOfScope": "Cet outil ne convient pas. {reason}",
    "errors.outOfScopeReason.generic": "Choisis un outil adapté à ce que tu veux écrire.",
    "errors.outOfScopeReason.gift":
      "Pour demander quel cadeau la personne veut ou améliorer ce message, utilise Correcteur de texte maladroit.",
    "errors.outOfScopeTryTool": "Outil suggéré : {toolName}.",
    "errors.invalidJson": "Requête invalide.",
    "errors.invalidPayload": "Saisie d’outil invalide.",
    "errors.inputTooLong": "La saisie doit faire au plus {max} caractères.",
    "errors.extraTooLong": "Les instructions supplémentaires doivent faire au plus {max} caractères.",
    "errors.rateLimit": "Trop de requêtes. Attends un peu puis réessaie.",
    "errors.insufficientCredits":
      "Crédits insuffisants pour cette génération. Ajoute des crédits ou choisis un modèle moins cher.",
    "errors.insufficientCreditsDetail":
      "Crédits insuffisants. Cette action nécessite {required} crédits ; solde {balance}.",
    "errors.insufficientCreditsAlt": "Crédits insuffisants pour une autre version.",
    "errors.insufficientCreditsAltDetail":
      "Crédits insuffisants pour une autre version. Requis {required} ; solde {balance}.",
    "errors.aiTemperatureUnsupported":
      "Ce modèle ne prend pas en charge ce réglage. Essaie Fast ou Pro, ou un autre modèle.",
    "legal.termsTitle": "Conditions d’utilisation",
    "legal.privacyTitle": "Politique de confidentialité",
    "legal.effective": "Date d’effet : {year}-01-01",
    "legal.termsMetaDescription":
      "Conditions d’utilisation d’isendai. Outils d’écriture IA, abonnements et packs de crédits.",
    "legal.privacyMetaDescription":
      "Politique de confidentialité d’isendai. Comment nous collectons, utilisons et stockons votre texte et vos données.",
    "legal.paymentsStub":
      "Forfaits et abonnements via Lemon Squeezy. Pendant l’examen marchand : checkout test ou crédits opérateur uniquement.",
    "growth.zeroCreditsHint":
      "Solde 0 : recharge dev sur Tarifs (local), connecte-toi ou demande des crédits à l’admin.",
    "growth.freeTrial.ctaButton": "Générez votre 1er message gratuitement 🎁",
    "growth.freeTrial.modalTitle": "Débloquez votre première génération gratuite",
    "growth.freeTrial.modalBody":
      "Entrez votre e-mail pour débloquer votre première génération IA gratuite sur cet appareil.",
    "growth.freeTrial.placeholder": "vous@entreprise.com",
    "growth.freeTrial.submit": "Débloquer et générer",
    "growth.freeTrial.cancel": "Annuler",
    "growth.freeTrial.invalidEmail": "Veuillez entrer une adresse e-mail valide.",
    "growth.freeTrial.deviceAlreadyUsed": "L’essai gratuit a déjà été utilisé sur cet appareil.",
    "success.pageFallbackTitle": "Résultat",

    "auth.disabled": "Accès indisponible",
    "auth.disabledTitle":
      "Supabase n’est pas configuré. Ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (ou SUPABASE_URL et SUPABASE_ANON_KEY), puis redéploie.",
    "auth.signedInFallback": "Connecté",
    "login.title": "Connexion",
    "login.subtitle":
      "Connectez-vous par e-mail, Google ou Facebook. Après la première connexion, nous demandons un court profil d’adhésion (nom, pays, usage principal).",
    "login.send": "Envoyer le lien",
    "login.sending": "Envoi…",
    "login.emailDivider": "Ou connectez-vous par email",
    "login.oauthTitle": "Connexion rapide",
    "login.oauthApple": "Apple",
    "login.oauthX": "X (Twitter)",
    "login.oauthLinkedin": "LinkedIn",
    "login.oauthInstagramSub": "Compte Instagram professionnel (Meta)",
    "login.oauthTiktok": "TikTok",
    "login.oauthTiktokSub": "Nécessite un fournisseur OAuth personnalisé « tiktok » dans Supabase",
    "login.oauthSetupHint":
      "Activez chaque fournisseur dans Supabase → Authentication → Providers. URL de redirection : /auth/callback",
    "login.oauthFailed": "Échec de la connexion sociale.",
    "login.oauthCallbackFailed": "Connexion impossible. Réessaie ou utilise email + mot de passe.",
    "login.oauthProviderError":
      "Erreur du fournisseur (annulé ou mauvaise config). Vérifie les URL de redirection Supabase et le client OAuth Google.",
    "login.missingSupabase": "Connexion non configurée (clés Supabase manquantes).",
    "login.membershipEmailTitle": "Email",
    "login.membershipEmailBody":
      "Utilise ton email personnel : crée un compte avec mot de passe, connecte-toi avec mot de passe ou demande un lien magique à usage unique. Après connexion, tu complètes ton profil d’adhésion.",
    "login.membershipSocialTitle": "Google ou Facebook",
    "login.membershipSocialBody":
      "Connecte-toi avec Google ou Facebook, puis confirme ou complète les informations d’adhésion à l’écran suivant.",
    "login.membershipGoogleTitle": "Compte Google",
    "login.membershipGoogleBody":
      "Utilise ton compte Google, puis confirme ou complète les informations d’adhésion à l’écran suivant.",
    "login.membershipFacebookTitle": "Compte Facebook",
    "login.membershipFacebookBody":
      "Utilise ton compte Facebook, puis confirme ou complète les informations d’adhésion à l’écran suivant.",
    "login.membershipInstagramTitle": "Compte Instagram",
    "login.membershipInstagramBody":
      "Comptes Instagram professionnels uniquement. Instagram ne partage pas l’e-mail — complète ton profil après connexion.",
    "login.oauthInstagram": "Continuer avec Instagram",
    "login.oauthInstagramNotConfigured":
      "Connexion Instagram non configurée. Ajoute le fournisseur custom:instagram dans Supabase (voir README).",
    "login.membershipOtherTitle": "Autres fournisseurs",
    "login.oauthGoogle": "Continuer avec Google",
    "login.oauthFacebook": "Continuer avec Facebook",
    "login.oauthOtherTitle": "Plus d’options de connexion",
    "login.emailInvalid": "Saisis une adresse email valide.",
    "login.emailSent": "Vérifie tes emails pour le lien de connexion.",
    "login.sendFailed": "Impossible d’envoyer le lien.",
    "login.emailRateLimit":
      "Trop d’emails envoyés trop vite (limite Supabase). Réessaie dans quelques minutes ; un admin peut augmenter la limite ou configurer un SMTP dédié dans Auth.",
    "login.emailPlaceholder": "toi@domaine.com",
    "login.passwordPlaceholder": "Mot de passe",
    "login.registerButton": "Créer un compte",
    "login.signInPasswordButton": "Se connecter avec mot de passe",
    "login.passwordTooShort": "Le mot de passe doit contenir au moins 6 caractères.",
    "login.passwordRequired": "Saisis ton mot de passe.",
    "login.confirmEmailSent": "Vérifie tes emails pour confirmer le compte, puis connecte-toi.",
    "login.signUpExistingEmail":
      "Cette adresse est peut‑être déjà enregistrée—aucun nouvel email de confirmation n’a été envoyé. Connecte‑toi avec ton mot de passe ou demande un lien magique ci‑dessous.",
    "login.invalidCredentialsHint":
      "Connexion refusée : mot de passe incorrect ou email non confirmé. Réessaie renvoyer la confirmation, mot de passe oublié, ou lien magique ci‑dessous.",
    "login.resendConfirmButton": "Renvoyer l’email de confirmation",
    "login.resendConfirmToast":
      "Si l’envoi réussit, vérifie tes emails sous peu (spam inclus).",
    "login.forgotPasswordButton": "Mot de passe oublié ?",
    "login.resetEmailSent": "Vérifie tes emails pour le lien de réinitialisation (spam inclus).",
    "login.updatePasswordTitle": "Nouveau mot de passe",
    "login.updatePasswordSubtitle":
      "Ton lien de réinitialisation est valide. Choisis un nouveau mot de passe, puis continue vers ton compte.",
    "login.newPasswordPlaceholder": "Nouveau mot de passe",
    "login.confirmPasswordPlaceholder": "Confirmer le mot de passe",
    "login.updatePasswordSubmit": "Enregistrer",
    "login.passwordMismatch": "Les mots de passe ne correspondent pas.",
    "login.passwordUpdated": "Mot de passe mis à jour.",
    "login.authFailed": "Connexion impossible.",
    "login.magicLinkDivider": "Ou te connecter sans mot de passe",
    "login.legalLead": "En continuant, vous acceptez nos",
    "login.legalMid": "et",
    "login.legalEnd": ".",

    "profile.title": "Profil d’adhésion",
    "profile.oauthEmailMissing":
      "Facebook n’a pas partagé votre e-mail. Saisissez-le ci-dessous, puis enregistrez le profil.",
    "profile.subtitle":
      "Ces informations sont stockées sur ton compte (métadonnées utilisateur Supabase) pour le support et les communications produit.",
    "profile.backToAccount": "Retour au compte",
    "profile.editLink": "Détails d’adhésion",
    "profile.emailLabel": "Email du compte",
    "profile.emailPlaceholder": "vous@exemple.com",
    "profile.emailHintOAuth":
      "Facebook n’a pas partagé votre e-mail. Saisissez-le ici — nous l’enregistrerons sur votre compte.",
    "profile.emailConfirmSent":
      "Nous avons envoyé un lien de confirmation à cette adresse. Ouvrez-le, puis revenez ici si besoin.",
    "profile.fullName": "Nom complet",
    "profile.phone": "Téléphone (optionnel)",
    "profile.country": "Pays ou région",
    "profile.countryPlaceholder": "Choisir un pays…",
    "profile.addressLabel": "Adresse (optionnel)",
    "profile.addressPlaceholder": "Rue, bâtiment, appartement…",
    "profile.cityLabel": "Ville (optionnel)",
    "profile.organization": "Entreprise ou école (optionnel)",
    "profile.jobTitle": "Poste ou titre (optionnel)",
    "profile.useCase": "Usage principal",
    "profile.useCasePlaceholder": "Choisis…",
    "profile.useCaseWork": "Travail & carrière",
    "profile.useCasePersonal": "Administratif perso",
    "profile.useCaseCreator": "Créateur / réseaux",
    "profile.useCaseStudent": "Étudiant / académique",
    "profile.useCaseAgency": "Agence / clients",
    "profile.useCaseOther": "Autre",
    "profile.defaultAiModel": "Version IA par défaut",
    "profile.defaultAiModelHint":
      "Présélectionnée à l’ouverture d’un outil. Vous pouvez la changer par question ; votre dernier choix est mémorisé sur cet appareil.",
    "profile.notes": "Autre chose à savoir ? (optionnel)",
    "profile.notesPlaceholder": "Contexte, objectifs, langues…",
    "profile.marketingOptIn": "M’envoyer parfois des nouveautés par email (optionnel).",
    "profile.acceptTerms":
      "Je confirme que les informations sont exactes et j’accepte les Conditions et la Politique de confidentialité.",
    "profile.save": "Enregistrer et continuer",
    "profile.saving": "Enregistrement…",
    "profile.saved": "Profil enregistré.",
    "profile.errors.required": "Remplis tous les champs obligatoires.",
    "profile.errors.emailRequired": "Saisis ton adresse e-mail.",
    "profile.errors.emailInvalid": "Saisis une adresse e-mail valide.",
    "profile.errors.terms": "Tu dois accepter les conditions pour continuer.",
    "profile.errors.save": "Impossible d’enregistrer le profil. Réessaie.",

    "tool.flow.hint":
      "Ensuite nous ouvrons la page de résultat et générons avec votre solde. Besoin de crédits ? Tarifs et paiement Lemon Squeezy.",
    "tool.modelSelectLabel": "Modèle IA pour cette requête",
    "tool.ctaCreditSuffix": " — selon modèle et longueur",
    "tool.priceReference": "Pack à l’usage pour ce palier : {pack}.",
    "tool.pricePackFlex":
      "Tous les packs : 10 crédits · 1 $ · 25 crédits · 1,49 $ · 50 crédits · 1,99 $. Voir Tarifs pour le calcul des crédits.",
    "tool.validation.empty": "Remplissez les champs requis avant de continuer.",
    "tool.billing.creditOne": "1 crédit",
    "tool.billing.creditsMany": "{n} crédits",
    "tool.billing.paidButton": "{action} · {amount}",

    "errors.toolParamMissing": "Paramètre d’outil manquant ou invalide.",
    "errors.noSavedInput":
      "Aucune entrée enregistrée dans localStorage pour cet outil. Revenez en arrière et réessayez.",
    "errors.savedInputParse":
      "Impossible de lire l’entrée enregistrée. Revenez en arrière et réessayez.",
    "errors.savedInputMismatch":
      "L’entrée enregistrée ne correspond pas à l’outil demandé. Revenez en arrière et réessayez.",
    "errors.savedInputInvalid":
      "L’entrée enregistrée est incomplète pour cet outil. Revenez en arrière et ajoutez plus de détails.",

    "tool.corporate-whisperer.title": "Le Chuchoteur Corporate",
    "tool.coverletter-ai.title": "Lettre de Motivation en 1 Clic",
    "tool.dating-roast.title": "Roast & Refonte de Profil",
    "tool.raise-negotiator.title": "Négociateur d’Augmentation",
    "tool.graceful-quitter.title": "Démission Élégante",
    "tool.cold-dm-icebreaker.title": "Brise‑glace DM",
    "tool.micromanager-tamer.title": "Domptage de Micromanager",
    "tool.invoice-chaser.title": "Relance de Facture",
    "tool.perfect-apology.title": "L’Excuse Parfaite",
    "tool.refund-demander.title": "Demande de Remboursement",
    "tool.deadline-diplomat.title": "Diplomate des Deadlines",
    "tool.landlord-diplomat.title": "Diplomate Proprio/Locataire",
    "tool.review-retaliator.title": "Réponse aux Avis",
    "tool.ghosting-resurrector.title": "Anti‑Ghosting",
    "tool.passive-aggressive-decoder.title": "Décodeur Passif‑Agressif",
    "tool.guilt-free-no.title": 'Le "Non" Sans Culpabilité',
    "tool.delicate-truth.title": "La Vérité Délicate",
    "tool.co-parenting-peacemaker.title": "Médiateur de Coparentalité",
    "tool.friendzone-navigator.title": "Navigateur de Friendzone",
    "tool.rsvp-diplomat.title": "Diplomate RSVP",

    "tool.insurance-claim-letter.title": "Lettre de Réclamation d’Assurance",
    "tool.insurance-claim-letter.desc":
      "Rédigez une lettre de réclamation claire avec les faits, les dates et la prise en charge demandée.",

    "tool.linkedin-headline-smith.title": "Forgeron de titres LinkedIn",

    "tool.corporate-to-caveman-translator.title": "Traducteur corporate → homme des cavernes",
    "tool.corporate-to-caveman-translator.desc":
      "Collez un long mail corporate ennuyeux. Nous le traduisons en une vérité primitive brutale, en quelques mots.",
  },
  de: {
    "brand.name": "isendai",
    "header.theme": "Theme wechseln",
    "socialProof.demoPrefix": "Demo:",
    "hero.kicker": "Chaos-Entwurf → sendefertige Nachricht ✨",
    "hero.title": "Noch nicht senden. Erst fixen.",
    "hero.subtitle":
      "Wut-Mail? Peinliche SMS? Halbe Bewerbung? Chaos einfügen. In Sekunden etwas, das du wirklich abschicken würdest.",
    "hero.cta": "Mein Chaos fixen (1. Versuch gratis 🎁)",
    "hero.modulusFamily": "Teil der MODULUS-Produktfamilie —",
    "hero.badge.noSubscription": "Kein Abo-Falle",
    "hero.badge.noSignups": "Gratis-Probe möglich",
    "hero.badge.payPerUse": "Zahlst beim Generieren",
    "promo.isend101.ariaLabel": "Zeitlich begrenztes Angebot",
    "promo.isend101.badge": "Zeitlich begrenztes Angebot",
    "promo.isend101.title": "50 % Rabatt — wild werden, weniger zahlen 🔥",
    "promo.isend101.body":
      "Code {code} beim Checkout — {percent} % auf jeden Plan oder Credit-Pack für begrenzte Zeit.",
    "promo.isend101.hint": "Code auf der Lemon-Squeezy-Zahlungsseite vor dem Bezahlen eingeben.",
    "promo.isend101.codeLabel": "Dein Code",
    "promo.isend101.copy": "Code kopieren",
    "promo.isend101.copied": "Code kopiert.",
    "promo.isend101.copiedShort": "Kopiert",
    "promo.isend101.copyFailed": "Kopieren fehlgeschlagen — Code manuell markieren.",
    "promo.isend101.viewPricing": "Pläne & Pakete ansehen",
    "hero.badge.noStore": "Wir speichern deinen Text nicht",

    "home.demo.before.label": "Vorher",
    "home.demo.after.label": "Nachher",
    "home.demo.title": "Vorher / Nachher",
    "home.demo.subtitle":
      "Produkt wählen, Transformation sehen und direkt klicken, um deine Version zu generieren.",
    "home.demo.examples.corp.before":
      "Das Design ist Müll, du hast mein Briefing eindeutig nicht gelesen!",
    "home.demo.examples.corp.after":
      "Ich habe das Gefühl, wir sind etwas vom ursprünglichen Briefing abgewichen. Können wir das Design prüfen, damit es wieder zur Startvision passt?",
    "home.demo.examples.quit.before":
      "Ich bin fertig. Ich kündige. Kontaktiert mich nicht mehr.",
    "home.demo.examples.quit.after":
      "Hi [Name] — ich kündige zum [Datum]. Vielen Dank für die Chance. Ich unterstütze eine saubere Übergabe und dokumentiere meine Aufgaben vor meinem letzten Tag.",
    "home.demo.examples.gift.before":
      "Ich will dir ein Geschenk kaufen, aber ich hab keine Ahnung. Sag mir einfach, was du willst.",
    "home.demo.examples.gift.after":
      "Ich würde dich gern mit etwas überraschen, das dir wirklich gefällt. Wenn du dir gerade eine Sache wünschen dürftest — was wäre das?",
    "home.demo.examples.caveman.before":
      "Lass uns das offline besprechen und nächste Woche wieder aufnehmen.",
    "home.demo.examples.caveman.after":
      "Ich hasse das. Später.",

    "section.tools.title":
      "Tool wählen. Text einfügen. Sofort eine bessere Version erhalten.",
    "section.tools.subtitle":
      "Fürs echte Leben: Business‑Mails, Bewerbungen und Dating‑Bios.",
    "tabs.corporate": "Business",
    "tabs.coverletter": "Anschreiben",
    "tabs.dating": "Dating‑Bio",
    "how.title": "So funktioniert’s",
    "how.1.title": "1) Einfügen",
    "how.1.body": "Entwurf, Jobpost oder Bio einfügen. Kein Format nötig.",
    "how.2.title": "2) Verbessern",
    "how.2.body": "KI schreibt mit besserem Ton, Struktur und Klarheit um.",
    "how.3.title": "3) Kopieren & senden",
    "how.3.body": "Sauberes Ergebnis mit Copy‑Button.",

    "how.detailed.title": "So funktioniert’s (4 einfache Schritte)",
    "how.detailed.subtitle":
      "Verwandle chaotische Gedanken in perfekte Nachrichten in unter 10 Sekunden.",
    "how.detailed.1.title": "1) Wähle dein Tool",
    "how.detailed.1.body":
      "Durchstöbere unsere Micro‑Tools im Menü oder frag den AI Concierge nach dem passenden Tool für deine Situation.",
    "how.detailed.2.title": "2) Füge deinen Entwurf ein",
    "how.detailed.2.body":
      "Füge wütende E‑Mails, ungeschickte Texte oder Notizen ein. Rechtschreibung egal – einfach alles rauslassen.",
    "how.detailed.3.title": "3) Wähle deine KI‑Power",
    "how.detailed.3.body":
      "Nimm 'Fast AI' (1 Credit) für schnelle Fixes oder 'Pro AI' (25 Credits) für wichtige Nachrichten. Die genauen Kosten stehen immer auf dem Button.",
    "how.detailed.4.title": "4) Feinschliff & absenden",
    "how.detailed.4.body":
      "Prüfe das Ergebnis, kopiere es oder lass eine andere Variante erzeugen. Sende mit voller Sicherheit.",
    "products.title": "Produkte (kurz, knackig, effektiv)",
    "products.subtitle": "Tools mit einem Ziel: besser klingen – schneller.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Klar sagen. Sicher senden.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "Passgenau. ATS‑ready. Interview‑ready.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Weniger cringe. Mehr Matches.",
    "faq.q1": "Speichert ihr meinen Text?",
    "faq.a1": "Nein. Er bleibt in deinem Browser (localStorage) für den Flow.",
    "faq.q2": "Wie funktioniert die Zahlung?",
    "faq.a2": "Pay‑per‑use. Sicher via Lemon Squeezy. Kein Abo‑Trick.",
    "faq.q3": "Was bekomme ich?",
    "faq.a3": "Einen polierten Text zum sofortigen Kopieren.",
    "footer.copyright": "© 2026 isendai.com. Für bessere Kommunikation.",
    "footer.modulusLead": "Teil der MODULUS-Produktfamilie —",
    "footer.modulus": "MODULUS Unternehmensseite",
    "footer.trust":
      "🔒 Sichere Zahlungen via Lemon Squeezy | ⚡ Powered by AI | 🚫 Wir speichern deine Daten nicht.",
    "tool.corp.desc":
      "Du willst deinen Chef/Client anschreien? Tu’s nicht. Schreib’s hier rein – wir machen daraus eine höfliche, HR‑taugliche Mail.",
    "tool.corp.placeholder":
      `Schreib, was du WIRKLICH sagen willst... (z. B. "Dieses Design ist Müll und du hast mein Briefing nicht gelesen.")`,
    "tool.corp.button": "Professionell umschreiben",
    "tool.action.generic": "Generieren",
    "tool.placeholder.generic": "Füge deinen Text hier ein…",
    "tool.cover.desc":
      "Keine Lust auf Copy‑Paste‑Anschreiben? Job‑URL und Skills einfügen – wir generieren ein passendes, ATS‑starkes Anschreiben.",
    "tool.cover.placeholder1": "Jobbeschreibung oder URL einfügen...",
    "tool.cover.placeholder2": "Lebenslauf oder Skills einfügen...",
    "tool.cover.button": "Anschreiben generieren",
    "tool.dating.desc":
      "Zu wenig Matches? KI roastet deine Bio, sagt dir warum’s nicht klappt, und schreibt eine neue, magnetische Version.",
    "tool.dating.placeholder": "Tinder/Bumble Bio einfügen oder deinen Vibe beschreiben...",
    "tool.dating.button": "Roast & Fix",
    "success.test": "Testmodus. Generiere…",
    "success.paid": "Zahlung erhalten. Generiere…",
    "success.introCredits":
      "Credits werden je nach Modell und Eingabelänge von deinem Kontostand abgebucht (500-Zeichen-Abschnitte).",
    "success.insufficientFallback": "Nicht genug Credits für diese Generierung.",
    "success.insufficientTitle": "Keine Credits mehr",
    "success.insufficientBody":
      "Unter Preise findest du Pakete und Aufladungen. Lokal: Dev‑Top‑up wie auf der Preisseite beschrieben, anmelden oder Admin um Credits bitten.",
    "success.usingSaved": "Wir nutzen deinen gespeicherten Input (localStorage).",
    "success.generating": "Wird generiert…",
    "success.copy": "Kopieren",
    "success.shareOnX": "Auf X teilen",
    "success.shareOnXAria": "Dieses Ergebnis auf X teilen",
    "success.downloadSocial": "Für IG/TikTok laden",
    "success.downloadSocialAria": "Teilen‑Bild für Instagram oder TikTok herunterladen",
    "success.downloadSocialToast": "Bild geladen — bereit zum Posten!",
    "success.downloadSocialFailed": "Bild konnte nicht erstellt werden.",
    "success.shareOnLinkedIn": "Auf LinkedIn teilen",
    "success.shareOnLinkedInAria": "Dieses Ergebnis auf LinkedIn teilen",
    "success.shareLinkedInToast":
      "Text kopiert! Füge ihn in deinen LinkedIn‑Beitrag ein.",
    "success.shareLinkedInCopyFailed":
      "Konnte nicht in die Zwischenablage kopieren. Kopiere den Text manuell.",
    "success.yourQuestion": "Deine Frage",
    "success.aiAnswer": "KI-Antwort",
    "success.shareToolbarAria": "Dieses Ergebnis teilen",
    "success.shareOnFacebook": "Auf Facebook teilen",
    "success.shareOnFacebookAria": "Dieses Ergebnis auf Facebook teilen",
    "success.shareFacebookToast":
      "Text kopiert! Füge ihn in deinen Facebook-Beitrag ein.",
    "success.shareOnInstagram": "Auf Instagram teilen",
    "success.shareOnInstagramAria": "Dieses Ergebnis auf Instagram teilen",
    "success.shareInstagramToast":
      "Text kopiert! Füge ihn in deine Instagram-Bildunterschrift ein.",
    "success.shareOnTikTok": "Auf TikTok teilen",
    "success.shareOnTikTokAria": "Dieses Ergebnis auf TikTok teilen",
    "success.shareTikTokToast":
      "Text kopiert! Füge ihn in deine TikTok-Beschreibung ein.",
    "success.shareCopyFailed":
      "Konnte nicht in die Zwischenablage kopieren. Kopiere den Text manuell.",
    "success.ready": "Bereit, wenn du es bist.",

    "success.ephemeral.title": "Hinweis",
    "success.ephemeral.body":
      "Diese Ergebnisse sind temporär. Wenn du diesen Tab/dieses Fenster schließt, werden sie gelöscht und sind nicht mehr abrufbar.",
    "success.alt.generate": "Alternative erzeugen",
    "success.alt.panelTitle": "Weitere Version erstellen",
    "success.alt.modelLabel": "KI‑Version für diese Alternative",
    "success.alt.limit": "Du hast das Maximum von 5 Alternativen für diese Generierung erreicht.",
    "success.alt.version": "Version",
    "success.alt.extra.label": "Extra‑Wünsche für die nächste Version (optional)",
    "success.alt.extra.placeholder":
      "z. B. menschlicher, leicht witzig, kürzer, formeller, wärmer, usw.",
    "success.versions": "Gespeicherte Versionen:",
    "success.selectedVersion": "Ausgewählte Version:",
    "success.feedback.question": "Wie gut war die KI?",
    "success.feedback.thanks": "Danke, dass du unsere KI weiterentwickelst! ✨",
    "success.feedback.thumbsUpAria": "Gutes Ergebnis",
    "success.feedback.thumbsDownAria": "Schlechtes Ergebnis",

    "home.sidebar.title": "KI‑Produkte",
    "home.workspace.hint": "Einfügen → Generieren → Kopieren",
    "home.aiStack.title": "Die Führenden KI-Modelle der Welt an Einem Ort 🧠",
    "home.aiStack.body":
      "Im Hintergrund arbeiten die Köpfe von Tech‑Riesen wie OpenAI (ChatGPT), Anthropic (Claude), Google und DeepSeek für dich. Keine Lust, ein Modell zu wählen? Lass es auf „Automatisch“ — wir picken das Passende für deinen Moment. Oder übernimm die Kontrolle und wähle deine Intelligenz im Menü! (Credit‑Verbrauch wird transparent nach der Stufe des gewählten Modells berechnet).",
    "home.expertBots.kicker": "Fach-Bots pro Thema",
    "home.expertBots.title": "Kein einzelner Chatbot — ein Spezialist für jedes Thema",
    "home.expertBots.lead":
      "isendai ist als Flotte von Experten-Bots gebaut, nicht als generischer Assistent. Jedes Tool ist auf seine Nische abgestimmt—Job-Mail, Anschreiben, Dating, Freelance-SOW, Behörden, Nachbarn, Creator, Familie—mit eigenen Prompts, Scope-Checks und intelligentem Routing zum besten Modell.",
    "home.expertBots.point1":
      "Themen-Bots: über 80 Micro-Tools in acht Lebensbereichen, jeweils mit eigener Persona und Ausgabeformat.",
    "home.expertBots.point2":
      "Multi-Provider-Engine: OpenAI, Anthropic, Gemini, Groq und DeepSeek—automatisch oder manuell aus einem Menü.",
    "home.expertBots.point3":
      "Production-Stack: Scope-Gates, transparente Credits, Versionshistorie und Antworten in deiner Sprache.",

    "category.work-career.label": "Karriere‑Boost",
    "category.crisis-money.label": "Geld‑SOS",
    "category.social-dating.label": "Freunde & Dates",
    "category.freelance-business.label": "Freelance‑Power",
    "category.academic-bureaucracy.label": "Papierkram‑Profi",
    "category.neighbors-living.label": "Zuhause‑Harmonie",
    "category.creators-media.label": "Creator‑Studio",
    "category.family-deep-personal.label": "Herz‑zu‑Herz",

    "concierge.title": "ISENDAI",
    "concierge.welcome":
      "Hi — wobei brauchst du heute Hilfe? (z. B. eine Business‑Mail, ein Anschreiben, eine Rückerstattungsnachricht, eine Dating‑Bio)",
    "concierge.placeholder": "Sag mir kurz, was du erreichen willst…",
    "concierge.send": "Senden",
    "concierge.thinking": "Denke nach…",
    "concierge.modelLabel": "KI-Modell für Antworten",
    "concierge.offScope.lead":
      "Mit isendai-Schreibtools können wir helfen—z. B. eine natürlichere Nachricht, um nach Geschenkwünschen zu fragen.",
    "concierge.offScope.try": "Probiere diese Tools:",
    "concierge.errors.chatFailed": "Chat fehlgeschlagen. Bitte erneut versuchen.",
    "concierge.errors.noReply": "Keine Antwort vom Assistenten.",
    "concierge.errors.invalidBody": "Ungültige Chat-Anfrage.",
    "concierge.errors.missingApi": "Concierge ist nicht konfiguriert.",
    "concierge.errors.invalidModel": "Ungültiges KI-Modell.",
    "concierge.errors.missingProvider": "KI-Anbieter nicht konfiguriert.",
    "concierge.errors.aiFailed": "Keine Antwort erhalten. Bitte erneut versuchen.",
    "concierge.errors.server": "Serverfehler. Bitte kurz warten.",
    "concierge.errors.authRequired": "Melde dich an, um den Assistenten-Chat zu nutzen.",

    "deploy.stagingBanner":
      "Staging-Umgebung — nicht die Live-Seite. Hier testen, dann in main mergen.",
    "deploy.stagingOpenProduction": "Produktion öffnen (isendai.com)",

    "nav.backToHome": "Zur Startseite",
    "nav.pricing": "Preise",
    "nav.privacy": "Datenschutz",
    "nav.terms": "AGB",
    "nav.faq": "FAQ",
    "nav.contact": "Kontakt",
    "legal.contact.lead": "Fragen? E-Mail:",
    "announce.newModel.badge": "Neu",
    "announce.newModel.title": "{model} ist da",
    "announce.newModel.body": "Unsere {tier}-Stufe läuft jetzt mit {model} – schärfere, zuverlässigere Ergebnisse bei gleichen Credits.",
    "announce.dismiss": "Verstanden",
    "contact.title": "Kontakt",
    "contact.lead": "Fragen zu Abrechnung, Konto oder Produkt? Schreib uns oder mail an",
    "contact.nameLabel": "Name",
    "contact.emailLabel": "E-Mail",
    "contact.subjectLabel": "Betreff (optional)",
    "contact.messageLabel": "Nachricht",
    "contact.submit": "Nachricht senden",
    "contact.sending": "Wird gesendet…",
    "contact.successToast": "Nachricht gesendet — wir melden uns bald.",
    "contact.successBody": "Danke! Nachricht erhalten. Antwort meist innerhalb eines Werktags.",
    "contact.errors.send": "Senden fehlgeschlagen. Erneut versuchen oder Support mailen.",
    "nav.login": "Anmelden · Konto",
    "nav.history": "Verlauf",
    "nav.account": "Konto",
    "nav.logout": "Abmelden",

    "creditsNav.title": "Credit‑Kontostand",
    "creditsNav.unit": "Credits",
    "creditsNav.trialOne": "Testphase: noch 1 Tag",
    "creditsNav.trialMany": "Testphase: noch {days} Tage",

    "modelSwitcher.ariaLabel": "KI‑Modellversion",
    "modelSwitcher.fast": "Fast AI (1 Credit)",
    "modelSwitcher.pro": "Pro AI (15 Credits)",
    "modelSwitcher.genius": "Genius AI (25 Credits)",
    "modelSwitcher.auto": "Auto (Tool wählt Anbieter)",
    "modelSwitcher.quickTiers": "Schnellstufen",
    "modelSwitcher.providerOpenai": "OpenAI",
    "modelSwitcher.providerAnthropic": "Anthropic",
    "modelSwitcher.providerGoogle": "Google Gemini",
    "modelSwitcher.providerGroq": "Groq",
    "modelSwitcher.providerDeepseek": "DeepSeek",

    "usage.creditsHeading": "Credits",
    "usage.versionsLine": "Versionen pro Generierung: {max}",
    "usage.requestsHeading": "Generierungen",
    "usage.open": "Öffnen",
    "usage.rerun": "Erneut ausführen",
    "usage.modelLabel": "Modell",
    "usage.chargedLine": "Credits verbraucht: {charged} · Max. Versionen: {max}",
    "usage.emptyRequests": "Noch keine Generierungen.",
    "history.title": "Verlauf",
    "history.subtitleUser": "Anfragen auf deinem Konto",
    "account.pageTitle": "Konto",
    "account.recentRequests": "Letzte Generierungen",
    "request.pageTitle": "Anfrage",
    "request.timeCreditsLine":
      "{date} · Credits verbraucht: {charged} · Max. Versionen: {max}",
    "request.inputStored": "Gespeicherte Eingabe",
    "request.versions": "Versionen",
    "request.versionLine": "Version {idx}",
    "request.noVersions": "Noch keine Versionen gespeichert.",
    "home.creditsSummary": "Credits: {credits} · Versionen pro Generierung: {max} · {scope}",
    "home.creditsScopeUser": "Angemeldet",
    "ui.copy": "Kopieren",
    "ui.copying": "Kopiere…",
    "ui.copied": "Kopiert.",
    "ui.copySuccessToast": "In die Zwischenablage kopiert! 📋",
    "ui.copyFailed": "Kopieren fehlgeschlagen.",

    "billing.lemon.pendingReview":
      "Zahlungen: Lemon-Prüfung läuft. Checkout ggf. nur Testmodus; Live nach Freigabe. Credits? Dev-Top-up auf Staging oder info@modulustech.app / Kontakt.",
    "billing.lemon.testMode":
      "Zahlungen: Lemon Squeezy im Testmodus. Testkarten im Checkout; Live erfordert Live-Modus in Lemon und Netlify.",
    "billing.lemon.unconfigured":
      "Zahlungen: Lemon Squeezy hier nicht konfiguriert. LEMON_SQUEEZY_* setzen oder Dev-Top-up auf Staging.",
    "pricing.title": "Preise",
    "pricing.subtitle":
      "Ab $7.99/Monat, Jahrespaket ~17 % günstiger oder PAYG ab $1. Economy & GPT‑4o mini: 1 Credit pro 500 Zeichen; Standard 15; Premium 25 (pro Block, aufgerundet).",
    "pricing.hero.intro": "Drei Wege, Credits zu laden — überall dieselben Regeln:",
    "pricing.hero.tagMonthly": "Monatlich",
    "pricing.hero.tagAnnual": "Jährlich",
    "pricing.hero.annualSaveBadge": "~17 %",
    "pricing.hero.tagPaygo": "Pay‑as‑you‑go",
    "pricing.hero.paygoHint": "Größere Packs öffnen mehr Modelle.",
    "pricing.hero.footerMain":
      "Economy & GPT‑4o mini: 1 Credit pro 500‑Zeichen‑Block. Standard: 15; Premium: 25 — jeder weitere Block addiert sich.",
    "pricing.hero.footerJump": "Credit‑Nutzung",
    "pricing.monthly.sectionTitle": "Monatliche Credit‑Pakete",
    "pricing.monthly.sectionLead":
      "Mit aktivem Lemon‑Squeezy‑Checkout verlängert sich das Abo jeweils zur Abrechnungsperiode. Wähle Starter, Growth oder Scale passend zu deinem Nutzungsvolumen.",
    "pricing.monthly.starter.name": "Starter",
    "pricing.monthly.starter.price": "7,99 $",
    "pricing.monthly.starter.credits": "500 Credits / Monat",
    "pricing.monthly.starter.desc": "Einstieg für wenig Volumen.",
    "pricing.monthly.growth.name": "Growth",
    "pricing.monthly.growth.price": "9,99 $",
    "pricing.monthly.growth.credits": "1.000 Credits / Monat",
    "pricing.monthly.growth.desc": "Regelmäßige tägliche Nutzung.",
    "pricing.monthly.scale.name": "Scale",
    "pricing.monthly.scale.price": "19,99 $",
    "pricing.monthly.scale.credits": "5.000 Credits / Monat",
    "pricing.monthly.scale.desc": "Hohes Volumen und Automatisierung.",
    "pricing.yearly.sectionTitle": "Jahrespakete",
    "pricing.yearly.sectionLead":
      "Dieselben drei Stufen wie monatlich, einmal pro Jahr abgerechnet. Jahreskontingent: 6.000 / 12.000 / 60.000 Credits (wie 500 / 1.000 / 5.000 pro Monat).",
    "pricing.yearly.starter.price": "79 $ / Jahr",
    "pricing.yearly.starter.credits": "6.000 Credits / Jahr",
    "pricing.yearly.starter.desc": "Entspricht Starter monatlich mit niedrigeren effektiven Monatskosten.",
    "pricing.yearly.starter.savings": "~17 % weniger als 12× Monatspreis",
    "pricing.yearly.growth.price": "99 $ / Jahr",
    "pricing.yearly.growth.credits": "12.000 Credits / Jahr",
    "pricing.yearly.growth.desc": "Entspricht Growth monatlich — ideal bei Jahresbindung.",
    "pricing.yearly.growth.savings": "~17 % weniger als 12× Monatspreis",
    "pricing.yearly.scale.price": "199 $ / Jahr",
    "pricing.yearly.scale.credits": "60.000 Credits / Jahr",
    "pricing.yearly.scale.desc": "Entspricht Scale monatlich — besonders sinnvoll bei Jahreszahlung und hohem Verbrauch.",
    "pricing.yearly.scale.savings": "~17 % weniger als 12× Monatspreis",
    "pricing.paygo.sectionTitle": "Pay‑as‑you‑go‑Pakete",
    "pricing.paygo.sectionLead":
      "Einmal‑Aufladung ohne Abo. Größere Pakete schalten Standard‑ und Premium‑Modelle frei.",
    "pricing.paygo.detailModalTitle": "{tier} — Nutzungsdetails",
    "pricing.paygo.infoButtonAria": "Nutzungsdetails für {tier}",
    "pricing.paygo.closeDetails": "Schließen",
    "pricing.buyNow": "Jetzt kaufen",
    "pricing.checkoutFailed": "Checkout konnte nicht gestartet werden. Lemon‑Squeezy‑Varianten prüfen oder erneut versuchen.",
    "pricing.checkoutSignInRequired": "Zum Kauf eines Abos anmelden.",
    "pricing.checkoutProfileRequired":
      "Bitte zuerst das Mitgliedsprofil ausfüllen — du wirst dorthin weitergeleitet.",
    "pricing.pack.budget": "10 Credits · 1 $",
    "pricing.pack.standard": "25 Credits · 1,49 $",
    "pricing.pack.premium": "50 Credits · 1,99 $",
    "pricing.allPaygoPacks": "10 Credits · $1 · 25 Credits · $1,49 · 50 Credits · $1,99",
    "pricing.tier.budget": "Budget",
    "pricing.tier.standard": "Standard",
    "pricing.tier.premium": "Premium",
    "pricing.tier.budgetPrice": "1 $",
    "pricing.tier.standardPrice": "1,49 $",
    "pricing.tier.premiumPrice": "1,99 $",
    "pricing.tier.budgetSummary":
      "Economy‑Modelle & GPT‑4o mini: 1 Credit pro 500‑Zeichen‑Block (aufgerundet).",
    "pricing.tier.standardSummary":
      "Standard‑Katalog: 15 Credits pro 500‑Zeichen‑Block (aufgerundet).",
    "pricing.tier.premiumSummary":
      "Premium‑Katalog: 25 Credits pro 500‑Zeichen‑Block (aufgerundet).",
    "pricing.tier.budgetDesc":
      "Economy‑Modelle plus GPT‑4o mini (wie Economy abgerechnet): aufrunden(Zeichen ÷ 500) × 1 Credit. Bsp.: 501 Zeichen → 2 Credits.",
    "pricing.tier.standardDesc":
      "$1,49‑Band: aufrunden(Zeichen ÷ 500) × 15 Credits. Bsp.: 1.000 Zeichen → 30 Credits. Flaggschiffe benötigen ein Premium‑Paket.",
    "pricing.tier.premiumDesc":
      "Voller Flaggschiff‑Katalog: aufrunden(Zeichen ÷ 500) × 25 Credits. Bsp.: 1.000 Zeichen → 50 Credits. Gleiche 500‑Zeichen‑Regel wie Standard, höherer Credit‑Verbrauch pro Block.",
    "pricing.usageGuide.sectionTitle": "So werden Credits verbraucht (pro Generierung)",
    "pricing.usageGuide.intro":
      "Abrechnung in 500‑Zeichen‑Blöcken (aufgerundet). Dein eingefügter Text plus Tool‑Kontext zählt zur Länge.",
    "pricing.usageGuide.miniBadge": "Economy & mini",
    "pricing.usageGuide.miniTitle": "GPT‑4o mini & Economy",
    "pricing.usageGuide.miniDesc":
      "1 Credit pro Block. Bsp.: 1–500 Zeichen → 1 Credit; 501–1.000 → 2 Credits.",
    "pricing.usageGuide.scaleSectionTitle": "Standard & Premium — Credits pro Block",
    "pricing.usageGuide.standardTitle": "Standard‑Modelle (Beispiele)",
    "pricing.usageGuide.standardBullets":
      "15 Credits pro 500‑Zeichen‑Block\n~500 Zeichen → ~15 Credits\n~1.000 Zeichen → ~30 Credits\n~1.500 Zeichen → ~45 Credits",
    "pricing.usageGuide.premiumTitle": "Premium‑Modelle (Beispiele)",
    "pricing.usageGuide.premiumBullets":
      "25 Credits pro 500‑Zeichen‑Block\n~500 Zeichen → ~25 Credits\n~1.000 Zeichen → ~50 Credits\n~1.500 Zeichen → ~75 Credits",
    "pricing.usageGuide.chartCaption": "Beispielrechnungen",
    "pricing.usageGuide.colShort": "~500 Z.",
    "pricing.usageGuide.colMid": "~1k Z.",
    "pricing.usageGuide.colLong": "~1,5k Z.",
    "pricing.usageGuide.chartHint":
      "Formel: aufrunden(Zeichen ÷ 500) × Tarif des Bands. Balken nur illustrativ.",
    "pricing.usageGuide.footer":
      "Beim Klick auf Generieren berechnen wir Credits aus deinem echten Prompt (Einfügen + Kontext). Jede Alternativversion läuft durch dieselbe Regel.",
    "pricing.modelNote.title": "Modelle nach Klasse",
    "pricing.modelNote.lead":
      "Jedes Katalogmodell gehört zu einer Abrechnungsklasse (gleiche Namen wie in der Tool-Auswahl). Credit-Tarife gelten pro Klasse; dein Pay-as-you-go-Paket kann einschränken, welche Klassen du wählen kannst.",
    "pricing.modelNote.packHint":
      "1-$-Paket → nur Fast AI · 1,49-$-Paket → Fast + Pro AI · 1,99-$-Paket → alle drei Klassen (Fast, Pro, Genius).",
    "pricing.sectionFootnote":
      "Versionslimit über deine Berechtigungen. Checkout über Lemon Squeezy (Live nach Freigabe des Stores).",
    "pricing.dev.title": "Entwicklermodus",
    "pricing.dev.body": "Credits in der Entwicklung lokal hinzufügen (nur Nicht-Produktion):",
    "pricing.dev.secretHint":
      "Wenn DEV_TOPUP_SECRET in .env.local gesetzt ist, Header X-Dev-Topup-Secret oder Authorization: Bearer mitsenden.",
    "pricing.dev.disabled": "In Produktion deaktiviert.",

    "pricingModal.title": "Credits aufstocken",
    "pricingModal.subtitle":
      "Abo mit 7‑Tage‑Test und Bonus‑Credits. Ohne Kündigung vor Ende startet das bezahlte Abo automatisch. Jährlich wird pro Verlängerung einmal der volle Jahresbetrag abgebucht. Credits werden pro Abrechnungszeitraum zurückgesetzt.",
    "pricingModal.monthly": "Monatlich",
    "pricingModal.yearly": "Jährlich",
    "pricingModal.closeAria": "Schließen",
    "pricingModal.plan.basic": "Basic",
    "pricingModal.plan.pro": "Pro",
    "pricingModal.plan.ultra": "Ultra",
    "pricingModal.mostPopular": "Am beliebtesten",
    "pricingModal.planCreditsLine": "{credits} Credits / Monat nach dem Test (pro Abrechnungszeitraum)",
    "pricingModal.trialGiftLine": "{credits} Bonus‑Credits während der 7‑Tage‑Testphase.",
    "pricingModal.afterTrialNote":
      "Vor Testende kündigen, um keine Abbuchung zu bekommen; sonst wechselt Lemon Squeezy automatisch ins bezahlte Abo.",
    "pricingModal.yearSingleCharge":
      "Jährlich nach Test: jede Verlängerung = eine Abbuchung von {total} (≈ {perMonth}/Monat).",
    "pricingModal.startTrial": "7‑Tage‑Test starten",
    "pricingModal.thenMonthly": "Danach {price}/Monat. Jederzeit kündbar.",
    "pricingModal.thenYearly":
      "Danach ~{price}/Monat effektiv (20 % Rabatt jährlich). Jederzeit kündbar.",
    "pricingModal.oneTimeTrial": "$1.49 Einmal‑Test ({credits} Credits)",
    "pricingModal.checkoutFailed": "Checkout konnte nicht gestartet werden.",
    "pricingModal.trialAlreadyUsedToast":
      "Du hast von diesem Browser schon ein Abo‑Test gestartet.",
    "pricingModal.oneTimePacksTitle": "Einmalige Credit‑Pakete",
    "pricingModal.oneTimePacksLead": "Kein Abo. Einmal zahlen — Credits werden gutgeschrieben, sobald die Bestellung bezahlt ist.",

    "notFound.title": "Seite nicht gefunden",
    "notFound.description": "Diese Seite existiert nicht.",
    "errorPage.title": "Etwas ist schiefgelaufen",
    "errorPage.description": "Unerwarteter Fehler. Erneut versuchen oder zur Startseite.",
    "errorPage.retry": "Erneut versuchen",
    "errors.serverToast": "Serverfehler. Bitte kurz warten und erneut versuchen.",
    "errors.generationFailed": "Generierung fehlgeschlagen.",
    "errors.signInRequired": "Bitte anmelden, um zu generieren.",
    "errors.noModelResult": "Kein Ergebnis zurückgegeben.",
    "errors.outOfScope": "Dieses Tool passt hier nicht. {reason}",
    "errors.outOfScopeReason.generic": "Wähle ein Tool, das zu deinem Schreibziel passt.",
    "errors.outOfScopeReason.gift":
      "Wenn du nach Geschenkwünschen fragst oder die Nachricht glätten willst, nutze Umständlicher Textfixierer.",
    "errors.outOfScopeTryTool": "Vorgeschlagenes Tool: {toolName}.",
    "errors.invalidJson": "Ungültige Anfrage.",
    "errors.invalidPayload": "Ungültige Tool-Eingabe.",
    "errors.inputTooLong": "Die Eingabe darf höchstens {max} Zeichen haben.",
    "errors.extraTooLong": "Zusätzliche Anweisungen dürfen höchstens {max} Zeichen haben.",
    "errors.rateLimit": "Zu viele Anfragen. Bitte kurz warten.",
    "errors.insufficientCredits":
      "Nicht genug Credits für diese Generierung. Credits aufladen oder günstigeres Modell wählen.",
    "errors.insufficientCreditsDetail":
      "Credits reichen nicht. Dieser Lauf braucht {required} Credits; Guthaben {balance}.",
    "errors.insufficientCreditsAlt": "Nicht genug Credits für eine weitere Version.",
    "errors.insufficientCreditsAltDetail":
      "Credits für weitere Version nicht ausreichend. Benötigt {required}; Guthaben {balance}.",
    "errors.aiTemperatureUnsupported":
      "Dieses Modell unterstützt diese Einstellung nicht. Probiere Fast oder Pro oder ein anderes Modell.",
    "legal.termsTitle": "Nutzungsbedingungen",
    "legal.privacyTitle": "Datenschutz",
    "legal.effective": "Gültig ab: {year}-01-01",
    "legal.termsMetaDescription":
      "Nutzungsbedingungen für isendai. KI-Schreibtools mit Abos und Credit-Paketen.",
    "legal.privacyMetaDescription":
      "Datenschutzerklärung für isendai. Wie wir deinen Text und Kontodaten erheben, nutzen und speichern.",
    "legal.paymentsStub":
      "Pakete und Abos über Lemon Squeezy. Während der Händlerprüfung: nur Test-Checkout oder Betreiber-Credits.",
    "growth.zeroCreditsHint":
      "Stand 0: Dev-Top-up unter Preise (nur lokal), anmelden oder Admin um Credits bitten.",
    "growth.freeTrial.ctaButton": "Erste Nachricht gratis generieren 🎁",
    "growth.freeTrial.modalTitle": "Erste kostenlose Generierung freischalten",
    "growth.freeTrial.modalBody":
      "Gib deine E-Mail ein, um deine erste kostenlose KI-Generierung auf diesem Gerät freizuschalten.",
    "growth.freeTrial.placeholder": "du@firma.de",
    "growth.freeTrial.submit": "Freischalten & generieren",
    "growth.freeTrial.cancel": "Abbrechen",
    "growth.freeTrial.invalidEmail": "Bitte gib eine gültige E-Mail-Adresse ein.",
    "growth.freeTrial.deviceAlreadyUsed": "Die Gratis-Testversion wurde auf diesem Gerät bereits genutzt.",
    "success.pageFallbackTitle": "Ergebnis",

    "auth.disabled": "Login nicht verfügbar",
    "auth.disabledTitle":
      "Supabase ist nicht konfiguriert. Setze NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY (oder SUPABASE_URL und SUPABASE_ANON_KEY) und deploye neu.",
    "auth.signedInFallback": "Angemeldet",
    "login.title": "Anmelden",
    "login.subtitle":
      "Melde dich per E‑Mail, Google oder Facebook an. Nach der ersten Anmeldung erfassen wir ein kurzes Mitgliedschaftsprofil (Name, Land, Hauptnutzung).",
    "login.send": "Link senden",
    "login.sending": "Senden…",
    "login.emailDivider": "Oder mit E‑Mail anmelden",
    "login.oauthTitle": "Schnell anmelden",
    "login.oauthApple": "Apple",
    "login.oauthX": "X (Twitter)",
    "login.oauthLinkedin": "LinkedIn",
    "login.oauthInstagramSub": "Professionelles Instagram‑Konto (Meta)",
    "login.oauthTiktok": "TikTok",
    "login.oauthTiktokSub": "Benötigt Custom OAuth „tiktok“ in Supabase",
    "login.oauthSetupHint":
      "Aktiviere die Anbieter in Supabase → Authentication → Providers. Redirect‑URL: /auth/callback",
    "login.oauthFailed": "Social‑Login fehlgeschlagen.",
    "login.oauthCallbackFailed": "Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen oder E‑Mail + Passwort nutzen.",
    "login.oauthProviderError":
      "Der Anbieter meldet einen Fehler (abgebrochen oder falsch konfiguriert). Prüfe Supabase‑Redirect‑URLs und den Google‑OAuth‑Client.",
    "login.missingSupabase": "Login nicht konfiguriert (Supabase‑Keys fehlen).",
    "login.membershipEmailTitle": "E‑Mail",
    "login.membershipEmailBody":
      "Nutze deine persönliche E‑Mail: Konto mit Passwort anlegen, mit Passwort anmelden oder einen einmaligen Magic Link anfordern. Nach der Anmeldung vervollständigst du dein Mitgliedschaftsprofil.",
    "login.membershipSocialTitle": "Google oder Facebook",
    "login.membershipSocialBody":
      "Melde dich mit Google oder Facebook an und bestätige oder ergänze die Mitgliedschaftsdaten auf der nächsten Seite.",
    "login.membershipGoogleTitle": "Google‑Konto",
    "login.membershipGoogleBody":
      "Nutze dein Google‑Konto und bestätige oder ergänze die Mitgliedschaftsdaten auf der nächsten Seite.",
    "login.membershipFacebookTitle": "Facebook‑Konto",
    "login.membershipFacebookBody":
      "Nutze dein Facebook‑Konto und bestätige oder ergänze die Mitgliedschaftsdaten auf der nächsten Seite.",
    "login.membershipInstagramTitle": "Instagram‑Konto",
    "login.membershipInstagramBody":
      "Nur professionelle Instagram‑Konten (Business/Creator). Instagram teilt keine E‑Mail — Profil danach ausfüllen.",
    "login.oauthInstagram": "Mit Instagram fortfahren",
    "login.oauthInstagramNotConfigured":
      "Instagram‑Login ist nicht eingerichtet. Provider custom:instagram in Supabase hinzufügen (siehe README).",
    "login.membershipOtherTitle": "Weitere Anbieter",
    "login.oauthGoogle": "Mit Google fortfahren",
    "login.oauthFacebook": "Mit Facebook fortfahren",
    "login.oauthOtherTitle": "Weitere Login‑Optionen",
    "login.emailInvalid": "Bitte eine gültige E‑Mail‑Adresse eingeben.",
    "login.emailSent": "Prüfe dein Postfach für den Login‑Link.",
    "login.sendFailed": "Link konnte nicht gesendet werden.",
    "login.emailRateLimit":
      "Zu viele E‑Mails in kurzer Zeit (Supabase‑Limit). Einige Minuten warten und erneut versuchen; im Auth‑Dashboard Limits anpassen oder eigenes SMTP nutzen.",
    "login.emailPlaceholder": "du@domain.de",
    "login.passwordPlaceholder": "Passwort",
    "login.registerButton": "Konto erstellen",
    "login.signInPasswordButton": "Mit Passwort anmelden",
    "login.passwordTooShort": "Das Passwort muss mindestens 6 Zeichen haben.",
    "login.passwordRequired": "Passwort eingeben.",
    "login.confirmEmailSent": "Bitte E‑Mail zur Bestätigung prüfen, danach anmelden.",
    "login.signUpExistingEmail":
      "Diese E‑Mail ist möglicherweise schon registriert—es wurde keine neue Bestätigungs‑Mail gesendet. Melde dich mit Passwort an oder fordere unten einen Magic‑Link an.",
    "login.invalidCredentialsHint":
      "Anmeldung fehlgeschlagen: falsches Passwort oder E‑Mail noch nicht bestätigt. Bestätigung erneut senden, Passwort vergessen oder Magic‑Link probieren.",
    "login.resendConfirmButton": "Bestätigungs‑E‑Mail erneut senden",
    "login.resendConfirmToast":
      "Wenn der Versand klappt, prüfe dein Postfach in Kürze (auch Spam).",
    "login.forgotPasswordButton": "Passwort vergessen?",
    "login.resetEmailSent": "Prüfe dein Postfach für den Passwort‑Reset‑Link (auch Spam).",
    "login.updatePasswordTitle": "Neues Passwort setzen",
    "login.updatePasswordSubtitle":
      "Der Reset‑Link ist gültig. Wähle ein neues Passwort und gehe weiter zu deinem Konto.",
    "login.newPasswordPlaceholder": "Neues Passwort",
    "login.confirmPasswordPlaceholder": "Passwort bestätigen",
    "login.updatePasswordSubmit": "Passwort speichern",
    "login.passwordMismatch": "Passwörter stimmen nicht überein.",
    "login.passwordUpdated": "Passwort aktualisiert.",
    "login.authFailed": "Anmeldung fehlgeschlagen.",
    "login.magicLinkDivider": "Oder ohne Passwort anmelden",
    "login.legalLead": "Mit Fortfahren akzeptierst du unsere",
    "login.legalMid": "und",
    "login.legalEnd": ".",

    "profile.title": "Mitgliedschaftsprofil",
    "profile.oauthEmailMissing":
      "Facebook hat deine E-Mail nicht geteilt. Trage sie unten ein und speichere das Profil.",
    "profile.subtitle":
      "Diese Angaben werden in deinem Konto gespeichert (Supabase‑Benutzermetadaten) für Support und Produktkommunikation.",
    "profile.backToAccount": "Zurück zum Konto",
    "profile.editLink": "Mitgliedschaftsdaten",
    "profile.emailLabel": "Konto‑E‑Mail",
    "profile.emailPlaceholder": "du@beispiel.de",
    "profile.emailHintOAuth":
      "Facebook hat keine E-Mail geteilt. Trage sie hier ein — wir speichern sie in deinem Konto.",
    "profile.emailConfirmSent":
      "Wir haben einen Bestätigungslink an diese Adresse gesendet. Öffne ihn und kehre bei Bedarf hierher zurück.",
    "profile.fullName": "Vollständiger Name",
    "profile.phone": "Telefon (optional)",
    "profile.country": "Land / Region",
    "profile.countryPlaceholder": "Land auswählen…",
    "profile.addressLabel": "Adresse (optional)",
    "profile.addressPlaceholder": "Straße, Hausnummer, Wohnung…",
    "profile.cityLabel": "Stadt (optional)",
    "profile.organization": "Firma oder Schule (optional)",
    "profile.jobTitle": "Rolle oder Titel (optional)",
    "profile.useCase": "Hauptnutzung",
    "profile.useCasePlaceholder": "Bitte wählen…",
    "profile.useCaseWork": "Arbeit & Karriere",
    "profile.useCasePersonal": "Privates / Verwaltung",
    "profile.useCaseCreator": "Creator / Social",
    "profile.useCaseStudent": "Student / akademisch",
    "profile.useCaseAgency": "Agentur / Kunden",
    "profile.useCaseOther": "Sonstiges",
    "profile.defaultAiModel": "Standard-KI-Version",
    "profile.defaultAiModelHint":
      "Wird beim Öffnen eines Tools vorausgewählt. Pro Frage änderbar; die letzte Wahl wird auf diesem Gerät gespeichert.",
    "profile.notes": "Noch etwas Wichtiges? (optional)",
    "profile.notesPlaceholder": "Kontext, Ziele, Sprachen…",
    "profile.marketingOptIn": "Gelegentlich Neuigkeiten per E‑Mail (optional).",
    "profile.acceptTerms":
      "Ich bestätige, dass die Angaben zutreffen, und akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.",
    "profile.save": "Speichern und weiter",
    "profile.saving": "Speichern…",
    "profile.saved": "Profil gespeichert.",
    "profile.errors.required": "Bitte alle Pflichtfelder ausfüllen.",
    "profile.errors.emailRequired": "Bitte gib deine E-Mail-Adresse ein.",
    "profile.errors.emailInvalid": "Bitte gib eine gültige E-Mail-Adresse ein.",
    "profile.errors.terms": "Bitte die Bedingungen akzeptieren, um fortzufahren.",
    "profile.errors.save": "Profil konnte nicht gespeichert werden. Bitte erneut versuchen.",

    "tool.flow.hint":
      "Als Nächstes öffnen wir die Ergebnisseite und generieren mit deinem Guthaben. Mehr Credits? Preise und Lemon-Squeezy-Checkout.",
    "tool.modelSelectLabel": "KI‑Modell für diese Anfrage",
    "tool.ctaCreditSuffix": " — je nach Modell und Länge",
    "tool.priceReference": "Pay-as-you-go-Paket für diese Modellstufe: {pack}.",
    "tool.pricePackFlex":
      "Alle Pakete: 10 Credits · $1 · 25 Credits · $1,49 · 50 Credits · $1,99. Siehe Preise für die Credit-Berechnung.",
    "tool.validation.empty": "Bitte fülle die Pflichtfelder aus, bevor du fortfährst.",
    "tool.billing.creditOne": "1 Credit",
    "tool.billing.creditsMany": "{n} Credits",
    "tool.billing.paidButton": "{action} · {amount}",

    "errors.toolParamMissing": "Tool‑Parameter fehlt oder ist ungültig.",
    "errors.noSavedInput":
      "Kein gespeicherter Input in localStorage für dieses Tool gefunden. Bitte geh zurück und versuche es erneut.",
    "errors.savedInputParse":
      "Gespeicherter Input konnte nicht gelesen werden. Bitte geh zurück und versuche es erneut.",
    "errors.savedInputMismatch":
      "Gespeicherter Input passt nicht zum angeforderten Tool. Bitte geh zurück und versuche es erneut.",
    "errors.savedInputInvalid":
      "Der gespeicherte Input ist für dieses Tool unvollständig. Bitte geh zurück und ergänze mehr Details.",

    "tool.corporate-whisperer.title": "Der Corporate‑Übersetzer",
    "tool.coverletter-ai.title": "Anschreiben in 1 Klick",
    "tool.dating-roast.title": "Dating‑Profil Roast & Fix",
    "tool.raise-negotiator.title": "Gehalts‑Verhandler",
    "tool.graceful-quitter.title": "Die Stilvolle Kündigung",
    "tool.cold-dm-icebreaker.title": "Cold‑DM Eisbrecher",
    "tool.micromanager-tamer.title": "Micromanager‑Bändiger",
    "tool.invoice-chaser.title": "Rechnungs‑Nachfasser",
    "tool.perfect-apology.title": "Die Perfekte Entschuldigung",
    "tool.refund-demander.title": "Rückerstattungs‑Forderrer",
    "tool.deadline-diplomat.title": "Deadline‑Diplomat",
    "tool.landlord-diplomat.title": "Vermieter‑Diplomat",
    "tool.review-retaliator.title": "Antwort auf Bewertungen",
    "tool.ghosting-resurrector.title": "Ghosting‑Wiederbeleber",
    "tool.passive-aggressive-decoder.title": "Passiv‑Aggressiv‑Decoder",
    "tool.guilt-free-no.title": 'Das Schuld‑freie "Nein"',
    "tool.delicate-truth.title": "Die Zarte Wahrheit",
    "tool.co-parenting-peacemaker.title": "Co‑Parenting Friedensstifter",
    "tool.friendzone-navigator.title": "Friendzone‑Navigator",
    "tool.rsvp-diplomat.title": "RSVP‑Diplomat",

    "tool.linkedin-headline-smith.title": "LinkedIn‑Headline‑Schmied",

    "tool.corporate-to-caveman-translator.title": "Übersetzer: Corporate → Höhlenmensch",
    "tool.corporate-to-caveman-translator.desc":
      "Füge eine lange, langweilige Firmen‑Mail ein. Wir übersetzen sie in die brutale, primitive Kurz‑Wahrheit.",
  },
  zh: {
    "brand.name": "isendai",
    "header.theme": "切换主题",
    "socialProof.demoPrefix": "演示：",
    "hero.kicker": "混乱草稿 → 敢发出去的消息 ✨",
    "hero.title": "先别发送。先修好。",
    "hero.subtitle":
      "暴怒邮件？尴尬短信？半成品求职信？粘贴混乱内容，几秒内得到你真的敢发出去的文字。",
    "hero.cta": "修好我的烂摊子（首次免费 🎁）",
    "hero.modulusFamily": "MODULUS 产品家族的一员 —",
    "hero.badge.noSubscription": "无订阅陷阱",
    "hero.badge.noSignups": "可免费尝鲜",
    "hero.badge.payPerUse": "按生成付费",
    "promo.isend101.ariaLabel": "限时优惠",
    "promo.isend101.badge": "限时优惠",
    "promo.isend101.title": "限时 5 折 — 放飞自我，少付钱 🔥",
    "promo.isend101.body":
      "结账时使用优惠码 {code} — 任意套餐或积分包限时享 {percent}% 折扣。",
    "promo.isend101.hint": "请在 Lemon Squeezy 安全支付页付款前输入优惠码。",
    "promo.isend101.codeLabel": "优惠码",
    "promo.isend101.copy": "复制优惠码",
    "promo.isend101.copied": "已复制到剪贴板。",
    "promo.isend101.copiedShort": "已复制",
    "promo.isend101.copyFailed": "无法复制 — 请手动选择优惠码。",
    "promo.isend101.viewPricing": "查看套餐与积分包",
    "hero.badge.noStore": "不保存你的文本",

    "home.demo.before.label": "改写前",
    "home.demo.after.label": "改写后",
    "home.demo.title": "前后对比",
    "home.demo.subtitle": "按产品查看改写效果，点击即可生成你的版本。",
    "home.demo.examples.corp.before": "这设计太烂了，你明显没看我的需求文档！",
    "home.demo.examples.corp.after":
      "我感觉我们稍微偏离了最初的 brief。能否一起过一遍设计，确保它与一开始的愿景一致？",
    "home.demo.examples.quit.before": "我受够了。我辞职。别再联系我。",
    "home.demo.examples.quit.after":
      "你好，[姓名]——我计划于[日期]正式离职。感谢这段经历与机会。我会在离开前协助交接并整理好相关文档。",
    "home.demo.examples.gift.before":
      "我想给你买礼物但完全不知道你想要什么。你直接告诉我吧。",
    "home.demo.examples.gift.after":
      "我想给你一个你真的会喜欢的惊喜。最近有没有一件你很想要/很想做的事？",
    "home.demo.examples.caveman.before": "我们线下再聊，下周再同步一下。",
    "home.demo.examples.caveman.after": "我讨厌。以后。",

    "section.tools.title": "选工具，粘贴文本，立刻得到更好的版本。",
    "section.tools.subtitle": "适用于工作邮件、求职申请与约会简介。",
    "tabs.corporate": "职场",
    "tabs.coverletter": "求职信",
    "tabs.dating": "约会简介",
    "how.title": "如何使用",
    "how.1.title": "1) 粘贴",
    "how.1.body": "粘贴草稿、职位描述或简介，无需格式。",
    "how.2.title": "2) 优化",
    "how.2.body": "AI 提升语气、结构与清晰度。",
    "how.3.title": "3) 复制发送",
    "how.3.body": "一键复制，直接发送。",

    "how.detailed.title": "如何使用（4 个简单步骤）",
    "how.detailed.subtitle": "10 秒内把杂乱想法变成完美消息。",
    "how.detailed.1.title": "1) 选择工具",
    "how.detailed.1.body":
      "在菜单中浏览微工具，或让 AI Concierge 为你的情况找到最合适的工具。",
    "how.detailed.2.title": "2) 粘贴草稿",
    "how.detailed.2.body":
      "粘贴愤怒邮件、尴尬短信或随手笔记。不用管错别字和格式，想到什么写什么。",
    "how.detailed.3.title": "3) 选择 AI 力度",
    "how.detailed.3.body":
      "快速修改选「Fast AI」（1 额度），重要消息选「Pro AI」（25 额度）。按钮上始终显示确切额度消耗。",
    "how.detailed.4.title": "4) 润色并发送",
    "how.detailed.4.body":
      "查看润色结果，复制或让 AI 生成另一版。放心发送。",
    "products.title": "产品（快速、好用、有效）",
    "products.subtitle": "每个工具只做一件事：让你更会说话。",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "强硬但得体。",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "定制、ATS 友好、面试加分。",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "少尴尬，多匹配。",
    "faq.q1": "会保存我的文本吗？",
    "faq.a1": "不会。文本仅保存在你的浏览器（localStorage）以完成流程。",
    "faq.q2": "支付如何进行？",
    "faq.a2": "按次付费。Lemon Squeezy 安全支付。没有订阅套路。",
    "faq.q3": "我会得到什么？",
    "faq.a3": "可立即复制的优化结果：邮件/求职信/简介。",
    "footer.copyright": "© 2026 isendai.com. 为更好的沟通而生。",
    "footer.modulusLead": "MODULUS 产品家族的一员 —",
    "footer.modulus": "MODULUS 企业站",
    "footer.trust": "🔒 Lemon Squeezy 安全支付 | ⚡ AI 驱动 | 🚫 不存储你的数据",
    "tool.corp.desc":
      "想对老板/客户发火？别。把真实想法写下来，我们帮你变成礼貌、HR 友好的邮件。",
    "tool.corp.placeholder":
      `写下你“真正”想说的话…（例如：“这个设计太烂了，你根本没看 brief。”）`,
    "tool.corp.button": "改写成职场语气",
    "tool.action.generic": "生成",
    "tool.placeholder.generic": "在此粘贴你的文本…",
    "tool.cover.desc":
      "厌倦每次都写一遍？粘贴职位 URL/描述和你的技能，我们生成定制的求职信。",
    "tool.cover.placeholder1": "粘贴职位描述或 URL…",
    "tool.cover.placeholder2": "粘贴简历内容或关键技能…",
    "tool.cover.button": "生成求职信",
    "tool.dating.desc":
      "匹配太少？AI 会吐槽你的简介、指出问题，并给你一版更有吸引力的新简介。",
    "tool.dating.placeholder": "粘贴你的 Tinder/Bumble 简介或描述你的风格…",
    "tool.dating.button": "吐槽并修复",
    "success.test": "测试模式：生成中…",
    "success.paid": "支付成功：生成中…",
    "success.introCredits": "将根据模型与输入长度从余额扣减额度（每 500 字为一段，向上取整）。",
    "success.insufficientFallback": "额度不足，无法完成生成。",
    "success.insufficientTitle": "额度已用完",
    "success.insufficientBody":
      "查看「价格与套餐」购买或充值。本地开发请按该页的 dev 充值说明操作，登录或联系管理员添加额度。",
    "success.usingSaved": "正在使用你在 localStorage 中保存的输入。",
    "success.generating": "生成中…",
    "success.copy": "复制",
    "success.shareOnX": "分享到 X",
    "success.shareOnXAria": "在 X 上分享此结果",
    "success.downloadSocial": "下载（IG/TikTok）",
    "success.downloadSocialAria": "下载适用于 Instagram 或 TikTok 的分享图",
    "success.downloadSocialToast": "图片已下载，可以发布！",
    "success.downloadSocialFailed": "无法生成图片。",
    "success.shareOnLinkedIn": "分享到 LinkedIn",
    "success.shareOnLinkedInAria": "在 LinkedIn 上分享此结果",
    "success.shareLinkedInToast": "文本已复制！请粘贴到 LinkedIn 帖子中。",
    "success.shareLinkedInCopyFailed": "无法复制到剪贴板，请手动复制文本。",
    "success.yourQuestion": "你的问题",
    "success.aiAnswer": "AI 回答",
    "success.shareToolbarAria": "分享此结果",
    "success.shareOnFacebook": "分享到 Facebook",
    "success.shareOnFacebookAria": "在 Facebook 上分享此结果",
    "success.shareFacebookToast": "文本已复制！粘贴到你的 Facebook 帖子中。",
    "success.shareOnInstagram": "分享到 Instagram",
    "success.shareOnInstagramAria": "在 Instagram 上分享此结果",
    "success.shareInstagramToast": "文本已复制！粘贴到你的 Instagram 说明中。",
    "success.shareOnTikTok": "分享到 TikTok",
    "success.shareOnTikTokAria": "在 TikTok 上分享此结果",
    "success.shareTikTokToast": "文本已复制！粘贴到你的 TikTok 描述中。",
    "success.shareCopyFailed": "无法复制到剪贴板，请手动复制文本。",
    "success.ready": "准备就绪。",

    "success.ephemeral.title": "提示",
    "success.ephemeral.body":
      "这些结果是临时的。如果你关闭此标签页/窗口，它们将被删除，之后无法再次访问。",
    "success.alt.generate": "生成备选版本",
    "success.alt.panelTitle": "再生成一个版本",
    "success.alt.modelLabel": "此备选版本使用的 AI 版本",
    "success.alt.limit": "本次生成最多只能有 5 个备选版本。",
    "success.alt.version": "版本",
    "success.alt.extra.label": "下一版的额外要求（可选）",
    "success.alt.extra.placeholder":
      "例如：更口语、更幽默一些、更短、更正式、更有温度等。",
    "success.versions": "已保存版本：",
    "success.selectedVersion": "已选择版本：",
    "success.feedback.question": "AI 表现如何？",
    "success.feedback.thanks": "感谢你帮助我们的 AI 不断进化！✨",
    "success.feedback.thumbsUpAria": "结果不错",
    "success.feedback.thumbsDownAria": "结果不佳",

    "home.sidebar.title": "AI 产品",
    "home.workspace.hint": "粘贴 → 生成 → 复制",
    "home.aiStack.title": "全球领先的 AI 模型，齐聚一处 🧠",
    "home.aiStack.body":
      "幕后有 OpenAI（ChatGPT）、Anthropic（Claude）、Google、DeepSeek 等科技巨头的大脑为你工作。不想纠结选哪个模型？交给「自动」模式，我们会为当下场景挑选最合适的模型。也可以完全掌控，在菜单里自选你的 AI！（积分按所选模型的智能档位透明计费。）",
    "home.expertBots.kicker": "分领域专家 Bot",
    "home.expertBots.title": "不是单一聊天机器人——每个场景都有专属专家",
    "home.expertBots.lead":
      "isendai 采用「专家 Bot 舰队」架构，而非通用助手。每个工具针对细分场景深度优化——工作邮件、求职信、约会、自由职业 SOW、政务文书、邻里、创作者、家庭——配备专属提示词、范围校验，并智能路由到该类别最佳模型。",
    "home.expertBots.point1":
      "分主题 Bot：80+ 微工具覆盖八大生活领域，各有独立人设与输出格式。",
    "home.expertBots.point2":
      "多供应商引擎：OpenAI、Anthropic、Gemini、Groq、DeepSeek——自动路由或菜单手动选择。",
    "home.expertBots.point3":
      "生产级技术栈：工具级范围门禁、透明积分计费、多版本历史、按输入语言回复。",

    "category.work-career.label": "职场加速",
    "category.crisis-money.label": "钱包急救",
    "category.social-dating.label": "社交与心动",
    "category.freelance-business.label": "自由职业加速",
    "category.academic-bureaucracy.label": "表格与申请",
    "category.neighbors-living.label": "居家邻里",
    "category.creators-media.label": "创作者工作室",
    "category.family-deep-personal.label": "走心对话",

    "concierge.title": "ISENDAI",
    "concierge.welcome":
      "你好 — 你今天需要什么帮助？（例如：工作邮件、求职信、退款消息、约会简介）",
    "concierge.placeholder": "告诉我你想做什么…",
    "concierge.send": "发送",
    "concierge.thinking": "思考中…",
    "concierge.modelLabel": "回复所用的 AI 模型",
    "concierge.offScope.lead":
      "我们可以用 isendai 写作工具帮你——例如润色一条更自然的消息，询问对方想要什么礼物。",
    "concierge.offScope.try": "试试这些工具：",
    "concierge.errors.chatFailed": "对话失败，请重试。",
    "concierge.errors.noReply": "助手没有返回回复。",
    "concierge.errors.invalidBody": "无效的对话请求。",
    "concierge.errors.missingApi": "Concierge 未配置。",
    "concierge.errors.invalidModel": "无效的 AI 模型。",
    "concierge.errors.missingProvider": "AI 提供商未配置。",
    "concierge.errors.aiFailed": "无法获取回复，请重试。",
    "concierge.errors.server": "服务器错误，请稍后重试。",
    "concierge.errors.authRequired": "请登录后使用助手聊天。",

    "deploy.stagingBanner": "预发布环境 — 非正式站点。合并到 main 前请在此测试。",
    "deploy.stagingOpenProduction": "打开正式站 (isendai.com)",

    "nav.backToHome": "返回首页",
    "nav.pricing": "价格与套餐",
    "nav.privacy": "隐私",
    "nav.terms": "条款",
    "nav.faq": "常见问题",
    "nav.contact": "联系",
    "legal.contact.lead": "有问题？请发邮件至",
    "announce.newModel.badge": "新",
    "announce.newModel.title": "{model} 已上线",
    "announce.newModel.body": "我们的 {tier} 档位现已采用 {model}——同样的额度，更精准、更可靠的结果。",
    "announce.dismiss": "知道了",
    "contact.title": "联系我们",
    "contact.lead": "账单、账户或产品问题？留言或发送邮件至",
    "contact.nameLabel": "姓名",
    "contact.emailLabel": "邮箱",
    "contact.subjectLabel": "主题（可选）",
    "contact.messageLabel": "消息",
    "contact.submit": "发送",
    "contact.sending": "发送中…",
    "contact.successToast": "已发送 — 我们会尽快回复。",
    "contact.successBody": "感谢！我们已收到你的消息，通常一个工作日内回复。",
    "contact.errors.send": "发送失败，请重试或邮件联系支持。",
    "nav.login": "登录 · 会员",
    "nav.history": "历史记录",
    "nav.account": "我的账户",
    "nav.logout": "退出登录",

    "creditsNav.title": "额度余额",
    "creditsNav.unit": "额度",
    "creditsNav.trialOne": "试用：还剩 1 天",
    "creditsNav.trialMany": "试用：还剩 {days} 天",

    "modelSwitcher.ariaLabel": "AI 模型版本",
    "modelSwitcher.fast": "Fast AI（1 额度）",
    "modelSwitcher.pro": "Pro AI（15 额度）",
    "modelSwitcher.genius": "Genius AI（25 额度）",
    "modelSwitcher.auto": "自动（由工具选择提供商）",
    "modelSwitcher.quickTiers": "快捷档位",
    "modelSwitcher.providerOpenai": "OpenAI",
    "modelSwitcher.providerAnthropic": "Anthropic",
    "modelSwitcher.providerGoogle": "Google Gemini",
    "modelSwitcher.providerGroq": "Groq",
    "modelSwitcher.providerDeepseek": "DeepSeek",

    "usage.creditsHeading": "额度",
    "usage.versionsLine": "每次生成最多版本数：{max}",
    "usage.requestsHeading": "生成记录",
    "usage.open": "打开",
    "usage.rerun": "重新运行",
    "usage.modelLabel": "模型",
    "usage.chargedLine": "已扣额度：{charged} · 最多版本：{max}",
    "usage.emptyRequests": "暂无生成记录。",
    "history.title": "历史记录",
    "history.subtitleUser": "你账户上的请求",
    "account.pageTitle": "我的账户",
    "account.recentRequests": "最近生成",
    "request.pageTitle": "请求",
    "request.timeCreditsLine": "{date} · 已扣额度：{charged} · 最多版本：{max}",
    "request.inputStored": "已保存输入",
    "request.versions": "版本",
    "request.versionLine": "版本 {idx}",
    "request.noVersions": "尚无已保存版本。",
    "home.creditsSummary": "额度：{credits} · 每次生成版本上限：{max} · {scope}",
    "home.creditsScopeUser": "已登录",
    "ui.copy": "复制",
    "ui.copying": "复制中…",
    "ui.copied": "已复制。",
    "ui.copySuccessToast": "已复制到剪贴板！📋",
    "ui.copyFailed": "复制失败。",

    "billing.lemon.pendingReview":
      "支付：Lemon 商户审核中。获批前结账可能仅为测试模式。需要额度？staging 开发充值或 info@modulustech.app / 联系。",
    "billing.lemon.testMode":
      "支付：Lemon Squeezy 测试模式。请用测试卡；正式扣款需在 Lemon 与 Netlify 开启 live。",
    "billing.lemon.unconfigured":
      "支付：此环境未配置 Lemon Squeezy。请设置 LEMON_SQUEEZY_* 或在 staging 使用开发充值。",
    "pricing.title": "价格与套餐",
    "pricing.subtitle":
      "月付 $7.99 起、年付约省 17%，或按次 $1 起。经济档与 GPT‑4o mini：每 500 字 1 额度；标准档 15；高级档 25（按块向上取整）。",
    "pricing.hero.intro": "三种充值方式 — 规则全站一致：",
    "pricing.hero.tagMonthly": "月付",
    "pricing.hero.tagAnnual": "年付",
    "pricing.hero.annualSaveBadge": "约省 17%",
    "pricing.hero.tagPaygo": "按次购买",
    "pricing.hero.paygoHint": "额度包越大，可解锁模型越多。",
    "pricing.hero.footerMain":
      "经济档与 GPT‑4o mini：每 500 字一块 1 额度。标准档：15；高级档：25 — 每多一块叠加。",
    "pricing.hero.footerJump": "额度怎么扣",
    "pricing.monthly.sectionTitle": "月度额度套餐",
    "pricing.monthly.sectionLead":
      "开通 Lemon Squeezy 结账后，订阅会按每个账单周期自动续费。请按用量选择入门、成长或规模档。",
    "pricing.monthly.starter.name": "入门",
    "pricing.monthly.starter.price": "$7.99",
    "pricing.monthly.starter.credits": "每月 500 额度",
    "pricing.monthly.starter.desc": "轻量个人使用。",
    "pricing.monthly.growth.name": "成长",
    "pricing.monthly.growth.price": "$9.99",
    "pricing.monthly.growth.credits": "每月 1,000 额度",
    "pricing.monthly.growth.desc": "稳定日常使用。",
    "pricing.monthly.scale.name": "规模",
    "pricing.monthly.scale.price": "$19.99",
    "pricing.monthly.scale.credits": "每月 5,000 额度",
    "pricing.monthly.scale.desc": "高频使用、自动化与高月度用量。",
    "pricing.yearly.sectionTitle": "年度套餐",
    "pricing.yearly.sectionLead":
      "与月度三档一致，按年计费。年度额度总量：6,000 / 12,000 / 60,000（相当于每月 500 / 1,000 / 5,000）。",
    "pricing.yearly.starter.price": "$79 / 年",
    "pricing.yearly.starter.credits": "每年 6,000 额度",
    "pricing.yearly.starter.desc": "与 Starter 月度用量一致，折算月成本更低。",
    "pricing.yearly.starter.savings": "比连续 12 个月按月付费约省 17%",
    "pricing.yearly.growth.price": "$99 / 年",
    "pricing.yearly.growth.credits": "每年 12,000 额度",
    "pricing.yearly.growth.desc": "与 Growth 月度一致，适合愿意年付的团队。",
    "pricing.yearly.growth.savings": "比连续 12 个月按月付费约省 17%",
    "pricing.yearly.scale.price": "$199 / 年",
    "pricing.yearly.scale.credits": "每年 60,000 额度",
    "pricing.yearly.scale.desc": "与 Scale 月度用量一致，适合年付且用量很大的场景。",
    "pricing.yearly.scale.savings": "比连续 12 个月按月付费约省 17%",
    "pricing.paygo.sectionTitle": "按次购买（额度包）",
    "pricing.paygo.sectionLead":
      "一次性充值额度，无需订阅。更大的额度包可解锁标准档与高级档模型。",
    "pricing.paygo.detailModalTitle": "{tier} — 使用说明",
    "pricing.paygo.infoButtonAria": "{tier} 的使用说明",
    "pricing.paygo.closeDetails": "关闭",
    "pricing.buyNow": "立即购买",
    "pricing.checkoutFailed": "无法开始结账。请配置 Lemon Squeezy 商品变体或稍后重试。",
    "pricing.checkoutSignInRequired": "购买订阅请先登录。",
    "pricing.checkoutProfileRequired": "购买前请先完成会员资料，正在跳转。",
    "pricing.pack.budget": "10 额度 · $1",
    "pricing.pack.standard": "25 额度 · $1.49",
    "pricing.pack.premium": "50 额度 · $1.99",
    "pricing.allPaygoPacks": "10 额度 · $1 · 25 额度 · $1.49 · 50 额度 · $1.99",
    "pricing.tier.budget": "经济",
    "pricing.tier.standard": "标准",
    "pricing.tier.premium": "高级",
    "pricing.tier.budgetPrice": "$1",
    "pricing.tier.standardPrice": "$1.49",
    "pricing.tier.premiumPrice": "$1.99",
    "pricing.tier.budgetSummary":
      "经济档模型与 GPT‑4o mini：每 500 字一块 1 额度（向上取整）。",
    "pricing.tier.standardSummary":
      "标准档目录：每 500 字一块 15 额度（向上取整）。",
    "pricing.tier.premiumSummary":
      "高级档目录：每 500 字一块 25 额度（向上取整）。",
    "pricing.tier.budgetDesc":
      "经济档模型及 GPT‑4o mini（按经济档计费）：⌈字符数÷500⌉×1 额度。例：501 字 → 2 额度。",
    "pricing.tier.standardDesc":
      "$1.49 档位：⌈字符数÷500⌉×15 额度。例：1,000 字 → 30 额度。旗舰模型需高级额度包。",
    "pricing.tier.premiumDesc":
      "旗舰完整目录：⌈字符数÷500⌉×25 额度。例：1,000 字 → 50 额度。与标准档同为 500 字分块；每块扣费更高。",
    "pricing.usageGuide.sectionTitle": "额度怎么扣（每次生成）",
    "pricing.usageGuide.intro":
      "按 500 字一块计费（向上取整）。粘贴内容与工具上下文一并计入长度。",
    "pricing.usageGuide.miniBadge": "经济 & mini",
    "pricing.usageGuide.miniTitle": "GPT‑4o mini 与经济档",
    "pricing.usageGuide.miniDesc":
      "每块 1 额度。例：1–500 字 → 1 额度；501–1,000 → 2 额度。",
    "pricing.usageGuide.scaleSectionTitle": "标准档与高级档 — 每块额度",
    "pricing.usageGuide.standardTitle": "标准档模型（示例）",
    "pricing.usageGuide.standardBullets":
      "每 500 字一块 15 额度\n~500 字 → ~15 额度\n~1,000 字 → ~30 额度\n~1,500 字 → ~45 额度",
    "pricing.usageGuide.premiumTitle": "高级档模型（示例）",
    "pricing.usageGuide.premiumBullets":
      "每 500 字一块 25 额度\n~500 字 → ~25 额度\n~1,000 字 → ~50 额度\n~1,500 字 → ~75 额度",
    "pricing.usageGuide.chartCaption": "示例合计",
    "pricing.usageGuide.colShort": "~500 字",
    "pricing.usageGuide.colMid": "~1k 字",
    "pricing.usageGuide.colLong": "~1.5k 字",
    "pricing.usageGuide.chartHint":
      "公式：⌈字符数÷500⌉×档位费率。柱状图为示意。",
    "pricing.usageGuide.footer":
      "点击「生成」时，会按你的真实提示（粘贴 + 工具上下文）计算额度。每个备选版本再跑一次同样规则。",
    "pricing.modelNote.title": "按档位的模型",
    "pricing.modelNote.lead":
      "目录中的每个模型属于一个计费档位（与工具内选择器名称一致）。额度按档位计费；按量付费包可能限制可选档位。",
    "pricing.modelNote.packHint":
      "$1 包 → 仅 Fast AI · $1.49 包 → Fast + Pro AI · $1.99 包 → 三档（Fast、Pro、Genius）。",
    "pricing.sectionFootnote":
      "每次生成的版本数以账户权益为准。结账由 Lemon Squeezy 提供（商店 live 后正式扣款）。",
    "pricing.dev.title": "开发者模式",
    "pricing.dev.body": "开发环境（非生产）可在本地充值额度：",
    "pricing.dev.secretHint": "若在 .env.local 设置了 DEV_TOPUP_SECRET，请附带请求头 X-Dev-Topup-Secret 或 Authorization: Bearer。",
    "pricing.dev.disabled": "生产环境已禁用此接口。",

    "pricingModal.title": "升级额度",
    "pricingModal.subtitle":
      "订阅含 7 天试用与赠送额度；试用结束前不取消则自动进入付费方案。年付每次续费为一次性扣全年金额。每个账单周期额度会重置。",
    "pricingModal.monthly": "按月",
    "pricingModal.yearly": "按年",
    "pricingModal.closeAria": "关闭",
    "pricingModal.plan.basic": "基础版",
    "pricingModal.plan.pro": "专业版",
    "pricingModal.plan.ultra": "旗舰版",
    "pricingModal.mostPopular": "最受欢迎",
    "pricingModal.planCreditsLine": "试用结束后每个账单周期每月 {credits} 额度",
    "pricingModal.trialGiftLine": "7 天试用期内赠送 {credits} 额度。",
    "pricingModal.afterTrialNote":
      "请在试用结束前取消以免扣款；否则 Lemon Squeezy 会自动续为付费订阅。",
    "pricingModal.yearSingleCharge":
      "年付（试用后）：每次续费一次性扣款 {total}（约合 {perMonth}/月）。",
    "pricingModal.startTrial": "开始 7 天免费试用",
    "pricingModal.thenMonthly": "之后 {price}/月。可随时取消。",
    "pricingModal.thenYearly": "之后约合 {price}/月（年付约省 20%）。可随时取消。",
    "pricingModal.oneTimeTrial": "$1.49 一次性试用（{credits} 额度）",
    "pricingModal.checkoutFailed": "无法开始结账。",
    "pricingModal.trialAlreadyUsedToast": "你已在此浏览器开始过订阅试用。",
    "pricingModal.oneTimePacksTitle": "一次性额度包",
    "pricingModal.oneTimePacksLead": "无需订阅，单次付款；订单支付成功后额度入账。",

    "notFound.title": "页面未找到",
    "notFound.description": "你要访问的页面不存在。",
    "errorPage.title": "出了点问题",
    "errorPage.description": "发生意外错误。请重试或返回首页。",
    "errorPage.retry": "重试",
    "errors.serverToast": "服务器错误，请稍后重试。",
    "errors.generationFailed": "生成失败。",
    "errors.signInRequired": "请登录后再生成。",
    "errors.noModelResult": "未返回结果。",
    "errors.outOfScope": "此工具不适合该请求。{reason}",
    "errors.outOfScopeReason.generic": "请选择与写作目的匹配的工具。",
    "errors.outOfScopeReason.gift": "询问对方想要什么礼物或润色这类消息，请使用尴尬文本修复工具。",
    "errors.outOfScopeTryTool": "建议使用：{toolName}。",
    "errors.invalidJson": "请求无效。",
    "errors.invalidPayload": "工具输入无效。",
    "errors.inputTooLong": "输入不得超过 {max} 个字符。",
    "errors.extraTooLong": "额外说明不得超过 {max} 个字符。",
    "errors.rateLimit": "请求过于频繁，请稍后再试。",
    "errors.insufficientCredits": "额度不足，无法完成本次生成。请充值或选择更经济的模型。",
    "errors.insufficientCreditsDetail": "额度不足。本次需要 {required} 点；当前余额 {balance} 点。",
    "errors.insufficientCreditsAlt": "额度不足，无法生成另一个版本。",
    "errors.insufficientCreditsAltDetail": "额度不足，无法生成另一版本。需要 {required} 点；余额 {balance} 点。",
    "errors.aiTemperatureUnsupported": "该模型不支持此参数。请尝试 Fast/Pro 档位或选择其他模型。",
    "legal.termsTitle": "服务条款",
    "legal.privacyTitle": "隐私政策",
    "legal.effective": "生效日期：{year}-01-01",
    "legal.termsMetaDescription": "isendai 服务条款。AI 写作工具、订阅与积分包。",
    "legal.privacyMetaDescription": "isendai 隐私政策。我们如何收集、使用和存储您的文本与账户数据。",
    "legal.paymentsStub": "套餐与订阅通过 Lemon Squeezy 销售。商户审核期间仅支持测试结账或由运营方授予额度。",
    "growth.zeroCreditsHint": "额度为 0：在「价格」页查看本地 dev 充值说明，或登录/联系管理员。",
    "growth.freeTrial.ctaButton": "免费生成第一条消息 🎁",
    "growth.freeTrial.modalTitle": "解锁首次免费生成",
    "growth.freeTrial.modalBody": "输入邮箱以在本设备解锁首次免费 AI 生成。",
    "growth.freeTrial.placeholder": "you@company.com",
    "growth.freeTrial.submit": "解锁并生成",
    "growth.freeTrial.cancel": "取消",
    "growth.freeTrial.invalidEmail": "请输入有效的邮箱地址。",
    "growth.freeTrial.deviceAlreadyUsed": "此设备已使用过免费试用。",
    "success.pageFallbackTitle": "结果",

    "auth.disabled": "登录不可用",
    "auth.disabledTitle":
      "未配置 Supabase。请设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY（或 SUPABASE_URL 与 SUPABASE_ANON_KEY），然后重新部署。",
    "auth.signedInFallback": "已登录",
    "login.title": "登录 / 会员",
    "login.subtitle":
      "可使用邮箱、Google 或 Facebook 登录。首次登录成功后，我们会收集简短的会员资料（姓名、国家/地区、主要用途）。",
    "login.send": "发送登录链接",
    "login.sending": "发送中…",
    "login.emailDivider": "或使用邮箱登录",
    "login.oauthTitle": "快捷登录",
    "login.oauthApple": "Apple",
    "login.oauthX": "X（Twitter）",
    "login.oauthLinkedin": "领英",
    "login.oauthInstagramSub": "Instagram 专业账号（Meta）",
    "login.oauthTiktok": "TikTok",
    "login.oauthTiktokSub": "需在 Supabase 配置自定义 OAuth，id 为 “tiktok”",
    "login.oauthSetupHint": "在 Supabase → Authentication → Providers 启用各提供商，回调 URL 需包含 /auth/callback",
    "login.oauthFailed": "社交登录失败。",
    "login.oauthCallbackFailed": "无法完成登录，请重试或使用邮箱和密码。",
    "login.oauthProviderError": "登录提供方返回错误（已取消或配置有误）。请检查 Supabase 重定向 URL 与 Google OAuth 客户端。",
    "login.missingSupabase": "未配置登录（缺少 Supabase 密钥）。",
    "login.membershipEmailTitle": "邮箱",
    "login.membershipEmailBody":
      "使用个人邮箱：可用密码注册账户、用密码登录，或索取一次性魔法链接（无需密码）。登录后完成会员资料。",
    "login.membershipSocialTitle": "Google 或 Facebook",
    "login.membershipSocialBody":
      "使用 Google 或 Facebook 登录后，在下一页确认或补充会员信息。",
    "login.membershipGoogleTitle": "Google 账号",
    "login.membershipGoogleBody":
      "使用 Google 登录后，在下一页确认或补充会员信息。",
    "login.membershipFacebookTitle": "Facebook 账号",
    "login.membershipFacebookBody":
      "使用 Facebook 登录后，在下一页确认或补充会员信息。",
    "login.membershipInstagramTitle": "Instagram 账号",
    "login.membershipInstagramBody":
      "仅限 Instagram 专业账号（企业/创作者）。Instagram 不分享邮箱，登录后请完善会员资料。",
    "login.oauthInstagram": "使用 Instagram 继续",
    "login.oauthInstagramNotConfigured":
      "尚未配置 Instagram 登录。请在 Supabase 添加 custom:instagram 提供商（见 README）。",
    "login.membershipOtherTitle": "其他登录方式",
    "login.oauthGoogle": "使用 Google 继续",
    "login.oauthFacebook": "使用 Facebook 继续",
    "login.oauthOtherTitle": "更多登录选项",
    "login.emailInvalid": "请输入有效的邮箱地址。",
    "login.emailSent": "请查收邮件中的登录链接。",
    "login.sendFailed": "无法发送登录链接。",
    "login.emailRateLimit":
      "短时间内发送邮件过多（Supabase 限制）。请等待几分钟后重试；可在 Supabase Auth 中提高限额或使用自定义 SMTP。",
    "login.emailPlaceholder": "you@example.com",
    "login.passwordPlaceholder": "密码",
    "login.registerButton": "注册账户",
    "login.signInPasswordButton": "密码登录",
    "login.passwordTooShort": "密码至少 6 个字符。",
    "login.passwordRequired": "请输入密码。",
    "login.confirmEmailSent": "请查收邮件确认账户后再登录。",
    "login.signUpExistingEmail":
      "该邮箱可能已注册，因此未发送新的确认邮件。请尝试用密码登录或在下方请求魔法链接。",
    "login.invalidCredentialsHint":
      "登录失败：密码可能错误或邮箱尚未确认。可尝试重新发送确认邮件、忘记密码或使用下方魔法链接。",
    "login.resendConfirmButton": "重新发送确认邮件",
    "login.resendConfirmToast": "若发送成功，请稍后查收邮箱（含垃圾邮件）。",
    "login.forgotPasswordButton": "忘记密码？",
    "login.resetEmailSent": "请查收重置密码邮件（含垃圾邮件）。",
    "login.updatePasswordTitle": "设置新密码",
    "login.updatePasswordSubtitle": "重置链接有效。设置新密码后继续进入账户。",
    "login.newPasswordPlaceholder": "新密码",
    "login.confirmPasswordPlaceholder": "确认新密码",
    "login.updatePasswordSubmit": "保存密码",
    "login.passwordMismatch": "两次输入的密码不一致。",
    "login.passwordUpdated": "密码已更新。",
    "login.authFailed": "无法完成登录。",
    "login.magicLinkDivider": "或不使用密码登录",
    "login.legalLead": "继续即表示你同意我们的",
    "login.legalMid": "与",
    "login.legalEnd": "。",

    "profile.title": "会员资料",
    "profile.oauthEmailMissing":
      "Facebook 未分享邮箱。请在下方邮箱栏填写并保存资料。",
    "profile.subtitle":
      "这些信息保存在你的账户中（Supabase 用户元数据），用于客服与产品相关沟通。",
    "profile.backToAccount": "返回账户",
    "profile.editLink": "会员资料",
    "profile.emailLabel": "账户邮箱",
    "profile.emailPlaceholder": "you@example.com",
    "profile.emailHintOAuth":
      "Facebook 未分享邮箱。请在此填写 — 我们将保存到你的账户。",
    "profile.emailConfirmSent":
      "我们已向该地址发送确认链接。请打开邮件中的链接，必要时再返回此页。",
    "profile.fullName": "姓名",
    "profile.phone": "电话（可选）",
    "profile.country": "国家 / 地区",
    "profile.countryPlaceholder": "请选择国家…",
    "profile.addressLabel": "地址（可选）",
    "profile.addressPlaceholder": "街道、门牌、楼栋、区县…",
    "profile.cityLabel": "城市（可选）",
    "profile.organization": "公司或学校（可选）",
    "profile.jobTitle": "职位或头衔（可选）",
    "profile.useCase": "主要使用场景",
    "profile.useCasePlaceholder": "请选择…",
    "profile.useCaseWork": "工作与职业",
    "profile.useCasePersonal": "个人事务",
    "profile.useCaseCreator": "创作者 / 社交内容",
    "profile.useCaseStudent": "学生 / 学术",
    "profile.useCaseAgency": "代理 / 客户服务",
    "profile.useCaseOther": "其他",
    "profile.defaultAiModel": "默认 AI 版本",
    "profile.defaultAiModelHint":
      "打开工具时预选。每道题仍可更改；上次选择会保存在本设备。",
    "profile.notes": "其他需要说明的信息（可选）",
    "profile.notesPlaceholder": "背景、目标、常用语言等…",
    "profile.marketingOptIn": "偶尔通过邮件接收新功能与技巧（可选）。",
    "profile.acceptTerms":
      "我确认信息准确，并同意服务条款与隐私政策。",
    "profile.save": "保存并继续",
    "profile.saving": "保存中…",
    "profile.saved": "资料已保存。",
    "profile.errors.required": "请填写所有必填项。",
    "profile.errors.emailRequired": "请输入邮箱地址。",
    "profile.errors.emailInvalid": "请输入有效的邮箱地址。",
    "profile.errors.terms": "需同意条款才能继续。",
    "profile.errors.save": "保存失败，请重试。",

    "tool.flow.hint":
      "接下来会打开结果页并用余额生成。需要更多额度？请前往定价页通过 Lemon Squeezy 购买。",
    "tool.modelSelectLabel": "本次请求使用的 AI 模型",
    "tool.ctaCreditSuffix": " — 按模型与长度计费",
    "tool.priceReference": "该模型档位的一次性额度包：{pack}。",
    "tool.pricePackFlex": "全部额度包：10 额度 · $1 · 25 额度 · $1.49 · 50 额度 · $1.99。计费规则见价格页。",
    "tool.validation.empty": "请先填写必填内容再继续。",
    "tool.billing.creditOne": "1 额度",
    "tool.billing.creditsMany": "{n} 额度",
    "tool.billing.paidButton": "{action} · {amount}",

    "errors.toolParamMissing": "缺少或无效的工具参数。",
    "errors.noSavedInput": "未在 localStorage 中找到该工具的已保存输入。请返回后重试。",
    "errors.savedInputParse": "已保存输入解析失败。请返回后重试。",
    "errors.savedInputMismatch": "已保存输入与请求的工具不匹配。请返回后重试。",
    "errors.savedInputInvalid": "已保存的输入信息不完整。请返回补充更多细节后再试。",

    "tool.corporate-whisperer.title": "职场话术润色师",
    "tool.coverletter-ai.title": "一键求职信",
    "tool.dating-roast.title": "约会资料吐槽与优化",
    "tool.raise-negotiator.title": "加薪谈判助手",
    "tool.graceful-quitter.title": "优雅辞职信",
    "tool.cold-dm-icebreaker.title": "冷启动私信破冰",
    "tool.micromanager-tamer.title": "微管理应对助手",
    "tool.invoice-chaser.title": "催款邮件助手",
    "tool.perfect-apology.title": "完美道歉稿",
    "tool.refund-demander.title": "退款申诉助手",
    "tool.deadline-diplomat.title": "延期沟通助手",
    "tool.landlord-diplomat.title": "房东沟通助手",
    "tool.review-retaliator.title": "差评回复助手",
    "tool.ghosting-resurrector.title": "反消失跟进助手",
    "tool.passive-aggressive-decoder.title": "被动攻击解码器",
    "tool.guilt-free-no.title": "无负担说“不”",
    "tool.delicate-truth.title": "温柔说真话",
    "tool.co-parenting-peacemaker.title": "共同育儿沟通助手",
    "tool.friendzone-navigator.title": "朋友区导航",
    "tool.rsvp-diplomat.title": "邀请回复礼貌拒绝",

    "tool.linkedin-headline-smith.title": "LinkedIn 标题锻造师",

    "tool.corporate-to-caveman-translator.title": "职场邮件→原始人翻译器",
    "tool.corporate-to-caveman-translator.desc":
      "粘贴一封又长又无聊的公司邮件。我们把它翻译成简短、粗暴的“原始真相”。",
  },
  tr: {
    "brand.name": "isendai",
    "header.theme": "Tema değiştir",
    "socialProof.demoPrefix": "Demo:",
    "hero.kicker": "Dağınık taslak → göndermeye cesaret edilen metin ✨",
    "hero.title": "Henüz Gönderme. Önce Düzelt.",
    "hero.subtitle":
      "Öfke maili mi? Garip mesaj mı? Yarım ön yazı mı? Karmaşayı yapıştır; saniyeler içinde gerçekten gönderebileceğin bir şey al.",
    "hero.cta": "Dağınıklığı Düzelt (ilk deneme bizden 🎁)",
    "hero.modulusFamily": "MODULUS ürün ailesinin bir parçası —",
    "hero.badge.noSubscription": "Abonelik tuzağı yok",
    "hero.badge.noSignups": "Ücretsiz tadım var",
    "hero.badge.payPerUse": "Ürettikçe öde",
    "promo.isend101.ariaLabel": "Sınırlı süre indirim kampanyası",
    "promo.isend101.badge": "Sınırlı süre kampanyası",
    "promo.isend101.title": "%50 indirim — az öde, çok glow-up 🔥",
    "promo.isend101.body":
      "Ödeme sırasında {code} kodunu kullanın — tüm plan ve kontör paketlerinde geçerli, sınırlı süre için %{percent} indirim.",
    "promo.isend101.hint": "Kodu Lemon Squeezy güvenli ödeme sayfasında, ödemeden önce girin.",
    "promo.isend101.codeLabel": "Kampanya kodu",
    "promo.isend101.copy": "Kodu kopyala",
    "promo.isend101.copied": "Kod panoya kopyalandı.",
    "promo.isend101.copiedShort": "Kopyalandı",
    "promo.isend101.copyFailed": "Kopyalanamadı — kodu elle seçin.",
    "promo.isend101.viewPricing": "Paketleri gör",
    "hero.badge.noStore": "Metnini saklamayız",

    "home.demo.before.label": "Önce",
    "home.demo.after.label": "Sonra",
    "home.demo.title": "Önce / Sonra (glow-up gerçek)",
    "home.demo.subtitle":
      "Bir vibe seç, kaosu medeni hale getir, kendi taslağına uygula.",
    "home.demo.examples.corp.before":
      "Bu tasarım berbat, brifimi okumamışsınız belli!",
    "home.demo.examples.corp.after":
      "Briften biraz sapmış gibi hissediyorum. Tasarımı, ilk vizyonumuzla uyumlu olduğundan emin olmak için birlikte gözden geçirebilir miyiz?",
    "home.demo.examples.quit.before":
      "Bıktım. İstifa ediyorum. Bir daha yazmayın.",
    "home.demo.examples.quit.after":
      "Merhaba [İsim] — [tarih] itibarıyla görevimden ayrılmak istiyorum. Fırsat için teşekkür ederim. Ayrılmadan önce sorumluluklarımı devretmek ve dokümantasyonu paylaşmak için destek olacağım.",
    "home.demo.examples.gift.before":
      "Sana hediye almak istiyorum ama ne istediğini hiç bilmiyorum. Söyle işte.",
    "home.demo.examples.gift.after":
      "Seni gerçekten mutlu edecek bir sürpriz yapmak istiyorum. Son zamanlarda aklında olan tek bir şey seçsen, ne olurdu?",
    "home.demo.examples.caveman.before":
      "Bunu offline konuşalım, haftaya tekrar dönelim.",
    "home.demo.examples.caveman.after":
      "Sevmem. Sonra.",

    "section.tools.title":
      "Aracını seç. Metni yapıştır. Daha iyi versiyonu anında al.",
    "section.tools.subtitle":
      "Gerçek hayat için: iş e-postaları, iş başvuruları ve flört biyoları.",
    "tabs.corporate": "Kurumsal",
    "tabs.coverletter": "Ön yazı",
    "tabs.dating": "Flört biyo",
    "how.title": "Nasıl çalışır?",
    "how.1.title": "1) Yapıştır",
    "how.1.body": "Taslağını, ilan metnini veya biyonu yapıştır. Format şart değil.",
    "how.2.title": "2) İyileştir",
    "how.2.body": "AI tonu, yapıyı ve netliği güçlendirerek yeniden yazar.",
    "how.3.title": "3) Kopyala & gönder",
    "how.3.body": "Tek tıkla kopyala, direkt gönder.",

    "how.detailed.title": "Nasıl Çalışır? (4 Basit Adım)",
    "how.detailed.subtitle":
      "Karmaşık düşüncelerinizi 10 saniyenin altında kusursuz mesajlara dönüştürün.",
    "how.detailed.1.title": "1) Aracınızı seçin",
    "how.detailed.1.body":
      "Menüden mikro araçlarımızı inceleyin veya tam durumunuza uygun aracı bulması için AI Concierge asistanımıza danışın.",
    "how.detailed.2.title": "2) Taslağınızı yapıştırın",
    "how.detailed.2.body":
      "Öfkeli e-postanızı, kaba metninizi veya basit notlarınızı yapıştırın. İmla kurallarını dert etmeyin; sadece içinizi dökün.",
    "how.detailed.3.title": "3) Yapay zeka gücünüzü seçin",
    "how.detailed.3.body":
      "Hızlı düzeltmeler için 'Fast AI' (1 Kredi), kritik mesajlar için 'Pro AI' (25 Kredi) seçin. Harcanacak kredi miktarı butonda her zaman şeffafça yazar.",
    "how.detailed.4.title": "4) Kopyala ve Gönder",
    "how.detailed.4.body":
      "Kusursuzlaştırılmış sonucu inceleyin, kopyalayın veya farklı bir ton için yeniden üretin. Artık %100 özgüvenle gönderebilirsiniz.",
    "products.title": "Ürünler (hızlı, net, etkili)",
    "products.subtitle": "Tek işi var: daha iyi görünmeni sağlamak.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Sert söyle. Güvenli gönder.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "Özel, ATS uyumlu, mülakat odaklı.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Daha az cringe. Daha çok match.",
    "faq.q1": "Metnimi saklıyor musunuz?",
    "faq.a1": "Hayır. Akışı tamamlamak için tarayıcında (localStorage) tutulur.",
    "faq.q2": "Ödeme nasıl çalışıyor?",
    "faq.a2": "Kullandıkça öde. Lemon Squeezy ile güvenli ödeme. Abonelik tuzağı yok.",
    "faq.q3": "Ne elde edeceğim?",
    "faq.a3": "Hemen kopyalayabileceğin parlatılmış bir çıktı.",
    "footer.copyright": "© 2026 isendai.com. Daha iyi iletişim için üretildi.",
    "footer.modulusLead": "MODULUS ürün ailesinin bir parçası —",
    "footer.modulus": "MODULUS kurumsal sitesi",
    "footer.trust":
      "🔒 Lemon Squeezy ödeme | ⚡ AI glow-up | 🚫 Taslaklarını hortumlamıyoruz",
    "tool.corp.desc":
      "Patronuna/müşterine bağırmak mı istiyorsun? Sakın. Buraya yaz; biz de kibar, HR-dostu bir e-postaya çevirelim.",
    "tool.corp.placeholder":
      `GERÇEKTEN söylemek istediğini yaz... (örn. "Bu tasarım berbat ve brief’i hiç okumamışsın.")`,
    "tool.corp.button": "Kurumsala çevir",
    "tool.action.generic": "Oluştur",
    "tool.placeholder.generic": "Metnini buraya yapıştır…",
    "tool.cover.desc":
      "Her ilana aynı ön yazıyı yazmaktan yoruldun mu? İlan URL/metnini ve becerilerini yapıştır. Özel bir ön yazı üretelim.",
    "tool.cover.placeholder1": "İlan metni veya URL yapıştır...",
    "tool.cover.placeholder2": "CV metnini veya ana becerilerini yapıştır...",
    "tool.cover.button": "Ön yazı üret",
    "tool.dating.desc":
      "Match yok mu? AI biyonu roastlar, neden olmadığını söyler ve daha çekici bir biyo yazar.",
    "tool.dating.placeholder": "Tinder/Bumble biyonu yapıştır ya da tarzını anlat...",
    "tool.dating.button": "Roastla & düzelt",
    "success.test": "Test modu. Sonuç hazırlanıyor…",
    "success.paid": "Ödeme alındı. Sonuç hazırlanıyor…",
    "success.introCredits":
      "Kontör, seçilen model ve giriş uzunluğuna göre bakiyenden düşülür (100 karakterlik dilimler).",
    "success.insufficientFallback": "Bu üretim için yeterli kontör yok.",
    "success.insufficientTitle": "Kontör bitti",
    "success.insufficientBody":
      "Paket ve yükleme için Paketler sayfasına bak. Yerelde aynı sayfadaki dev top‑up notlarını kullan, giriş yap veya yöneticiden kontör iste.",
    "success.usingSaved": "localStorage’daki kaydını kullanıyoruz.",
    "success.generating": "Üretiliyor…",
    "success.copy": "Kopyala",
    "success.shareOnX": "X’te paylaş",
    "success.shareOnXAria": "Sonucu X’te paylaş",
    "success.downloadSocial": "IG/TikTok için indir",
    "success.downloadSocialAria": "Instagram veya TikTok için görsel indir",
    "success.downloadSocialToast": "Görsel indirildi — paylaşıma hazır!",
    "success.downloadSocialFailed": "Görsel oluşturulamadı.",
    "success.shareOnLinkedIn": "LinkedIn'de paylaş",
    "success.shareOnLinkedInAria": "Sonucu LinkedIn'de paylaş",
    "success.shareLinkedInToast":
      "Metin kopyalandı! LinkedIn gönderinize yapıştırın.",
    "success.shareLinkedInCopyFailed":
      "Panoya kopyalanamadı. Metni elle kopyalamayı deneyin.",
    "success.yourQuestion": "Sorunuz",
    "success.aiAnswer": "AI yanıtı",
    "success.shareToolbarAria": "Bu sonucu paylaş",
    "success.shareOnFacebook": "Facebook'ta paylaş",
    "success.shareOnFacebookAria": "Sonucu Facebook'ta paylaş",
    "success.shareFacebookToast":
      "Metin kopyalandı! Facebook gönderinize yapıştırın.",
    "success.shareOnInstagram": "Instagram'da paylaş",
    "success.shareOnInstagramAria": "Sonucu Instagram'da paylaş",
    "success.shareInstagramToast":
      "Metin kopyalandı! Instagram açıklamasına yapıştırın.",
    "success.shareOnTikTok": "TikTok'ta paylaş",
    "success.shareOnTikTokAria": "Sonucu TikTok'ta paylaş",
    "success.shareTikTokToast":
      "Metin kopyalandı! TikTok açıklamasına yapıştırın.",
    "success.shareCopyFailed":
      "Panoya kopyalanamadı. Metni elle kopyalamayı deneyin.",
    "success.ready": "Hazır olduğunda.",

    "success.ephemeral.title": "Bilgi",
    "success.ephemeral.body":
      "Bu sonuçlar geçicidir. Sekmeyi/pencereyi kapatırsan silinir ve tekrar erişemezsin.",
    "success.alt.generate": "Alternatif üret",
    "success.alt.panelTitle": "Yeni bir versiyon oluştur",
    "success.alt.modelLabel": "Bu alternatif için yapay zeka sürümü",
    "success.alt.limit": "Bu üretim için en fazla 5 alternatif üretebilirsin.",
    "success.alt.version": "Versiyon",
    "success.alt.extra.label": "Bir sonraki versiyon için ek istekler (opsiyonel)",
    "success.alt.extra.placeholder":
      "örn. daha insancıl, biraz komik, daha kısa, daha resmi, daha sıcak bir ton, vb.",
    "success.versions": "Kaydedilen versiyon:",
    "success.selectedVersion": "Seçili versiyon:",
    "success.feedback.question": "Yapay zeka nasıl iş çıkardı?",
    "success.feedback.thanks": "AI'ımızın gelişmesine yardım ettiğin için teşekkürler! ✨",
    "success.feedback.thumbsUpAria": "İyi sonuç",
    "success.feedback.thumbsDownAria": "Zayıf sonuç",

    "home.sidebar.title": "AI Ürünleri",
    "home.workspace.hint": "Yapıştır → Üret → Kopyala",
    "home.aiStack.title": "Dünyanın Önde Gelen Yapay Zeka Modelleri Tek Bir Yerde 🧠",
    "home.aiStack.body":
      "Arka planda OpenAI (ChatGPT), Anthropic (Claude), Google ve DeepSeek gibi teknoloji devlerinin beyinleri sizin için çalışıyor. Hangi modeli seçeceğinizi düşünmek istemiyor musunuz? İşi \"Otomatik\" moda bırakın, o anki kriziniz için en uygun modeli biz seçelim. Ya da kontrolü tamamen elinize alıp menüden kendi zekanızı kendiniz belirleyin! (Kredi harcamalarınız, seçtiğiniz modelin zeka seviyesine göre şeffaf bir şekilde hesaplanır).",
    "home.expertBots.kicker": "Konuya özel uzman botlar",
    "home.expertBots.title": "Tek bir sohbet botu değil — her konuda uzmanlaşmış bot",
    "home.expertBots.lead":
      "isendai, genel amaçlı bir asistan değil; konuya göre uzmanlaştırılmış bir bot filosu olarak tasarlandı. Her araç kendi alanına göre ince ayarlıdır — iş e-postası, ön yazı, flört, freelance kapsamı, bürokrasi, komşuluk, içerik üretimi, aile — özel prompt’lar, kapsam kontrolü ve o kategori için en uygun modele akıllı yönlendirme ile.",
    "home.expertBots.point1":
      "Alan botları: sekiz yaşam alanında 80+ mikro araç; her birinin kendi kişiliği ve çıktı formatı var.",
    "home.expertBots.point2":
      "Çok sağlayıcılı motor: OpenAI, Anthropic, Gemini, Groq ve DeepSeek — otomatik veya tek menüden elle seçim.",
    "home.expertBots.point3":
      "Kurumsal düzey altyapı: araç bazlı kapsam kapıları, şeffaf kontör, sürüm geçmişi ve girdi dilinde yanıt.",

    "concierge.title": "ISENDAI",
    "concierge.welcome":
      "Merhaba — bugün neye ihtiyacın var? (örn. iş e-postası, ön yazı, iade talebi, flört biyosu)",
    "concierge.placeholder": "Ne yapmak istediğini kısaca yaz…",
    "concierge.send": "Gönder",
    "concierge.thinking": "Düşünüyor…",
    "concierge.modelLabel": "Yanıtlar için yapay zeka modeli",
    "concierge.openTool": "Aracı aç",
    "concierge.offScope.lead":
      "isendai yazım araçlarıyla yardımcı olabiliriz—örneğin hediye isteğini kibarca sormak için daha akıcı bir mesaj taslağı.",
    "concierge.offScope.try": "Şu araçları dene:",
    "concierge.errors.chatFailed": "Sohbet başarısız. Lütfen tekrar dene.",
    "concierge.errors.noReply": "Asistandan yanıt gelmedi.",
    "concierge.errors.invalidBody": "Geçersiz sohbet isteği.",
    "concierge.errors.missingApi": "Concierge yapılandırılmamış.",
    "concierge.errors.invalidModel": "Geçersiz yapay zeka modeli.",
    "concierge.errors.missingProvider": "Yapay zeka sağlayıcısı yapılandırılmamış.",
    "concierge.errors.aiFailed": "Yanıt alınamadı. Lütfen tekrar dene.",
    "concierge.errors.server": "Sunucu hatası. Kısa süre sonra tekrar dene.",
    "concierge.errors.authRequired": "Asistan sohbeti için lütfen giriş yap.",

    "deploy.stagingBanner":
      "Staging ortamı — müşterilere açık canlı site değil. main’e almadan önce burada test edin.",
    "deploy.stagingOpenProduction": "Canlı siteyi aç (isendai.com)",

    "nav.backToHome": "Ana sayfaya dön",
    "nav.pricing": "Paketler",
    "nav.privacy": "Gizlilik",
    "nav.terms": "Şartlar",
    "nav.faq": "SSS",
    "nav.contact": "İletişim",
    "legal.contact.lead": "Sorularınız için e-posta:",
    "announce.newModel.badge": "Yeni",
    "announce.newModel.title": "{model} geldi",
    "announce.newModel.body": "{tier} katmanımız artık {model} ile çalışıyor — aynı kontörle daha keskin ve güvenilir sonuçlar.",
    "announce.dismiss": "Anladım",
    "contact.title": "İletişim",
    "contact.lead": "Fatura, hesap veya ürün soruların mı var? Mesaj gönder veya e-posta at:",
    "contact.nameLabel": "Ad",
    "contact.emailLabel": "E-posta",
    "contact.subjectLabel": "Konu (isteğe bağlı)",
    "contact.messageLabel": "Mesaj",
    "contact.submit": "Mesaj gönder",
    "contact.sending": "Gönderiliyor…",
    "contact.successToast": "Mesajın gönderildi — kısa sürede döneceğiz.",
    "contact.successBody": "Teşekkürler! Mesajını aldık. Genelde bir iş günü içinde yanıtlarız.",
    "contact.errors.send": "Gönderilemedi. Tekrar dene veya destek e-postasına yaz.",
    "nav.login": "Üyelik / Giriş",
    "nav.history": "Geçmiş",
    "nav.account": "Hesabım",
    "nav.logout": "Çıkış",

    "creditsNav.title": "Kontör bakiyesi",
    "creditsNav.unit": "Kontör",
    "creditsNav.trialOne": "Deneme: 1 gün kaldı",
    "creditsNav.trialMany": "Deneme: {days} gün kaldı",

    "modelSwitcher.ariaLabel": "Yapay zeka model sürümü",
    "modelSwitcher.fast": "Fast AI (1 Kontör)",
    "modelSwitcher.pro": "Pro AI (15 Kontör)",
    "modelSwitcher.genius": "Genius AI (25 Kontör)",
    "modelSwitcher.auto": "Otomatik (araç sağlayıcı seçer)",
    "modelSwitcher.quickTiers": "Hızlı seviyeler",
    "modelSwitcher.providerOpenai": "OpenAI",
    "modelSwitcher.providerAnthropic": "Anthropic",
    "modelSwitcher.providerGoogle": "Google Gemini",
    "modelSwitcher.providerGroq": "Groq",
    "modelSwitcher.providerDeepseek": "DeepSeek",

    "usage.creditsHeading": "Kontör",
    "usage.versionsLine": "Üretim başına en fazla sürüm: {max}",
    "usage.requestsHeading": "Üretimler",
    "usage.open": "Aç",
    "usage.rerun": "Yeniden çalıştır",
    "usage.modelLabel": "Model",
    "usage.chargedLine": "Harcanan kontör: {charged} · En fazla sürüm: {max}",
    "usage.emptyRequests": "Henüz üretim yok.",
    "history.title": "Geçmiş",
    "history.subtitleUser": "Hesabındaki istekler",
    "account.pageTitle": "Hesabım",
    "account.recentRequests": "Son üretimler",
    "request.pageTitle": "İstek",
    "request.timeCreditsLine":
      "{date} · Harcanan kontör: {charged} · En fazla sürüm: {max}",
    "request.inputStored": "Kayıtlı girdi",
    "request.versions": "Sürümler",
    "request.versionLine": "Sürüm {idx}",
    "request.noVersions": "Henüz kayıtlı sürüm yok.",
    "home.creditsSummary": "Kontör: {credits} · Üretim başına sürüm: {max} · {scope}",
    "home.creditsScopeUser": "Giriş yapıldı",
    "ui.copy": "Kopyala",
    "ui.copying": "Kopyalanıyor…",
    "ui.copied": "Kopyalandı.",
    "ui.copySuccessToast": "Panoya kopyalandı! 📋",
    "ui.copyFailed": "Kopyalanamadı.",

    "billing.lemon.pendingReview":
      "Ödeme: Lemon mağaza incelemesi sürüyor. Checkout test modunda; canlı tahsilat onay sonrası. Kontör: staging dev top-up veya info@modulustech.app / İletişim.",
    "billing.lemon.testMode":
      "Ödeme: Lemon Squeezy test modunda. Test kartları kullanın; canlı için Lemon ve Netlify’da live mod gerekir.",
    "billing.lemon.unconfigured":
      "Ödeme: Bu deploy’da Lemon Squeezy tam yapılandırılmamış. LEMON_SQUEEZY_* veya staging dev top-up.",
    "pricing.title": "Paketler",
    "pricing.subtitle":
      "$7.99’dan aylık, yıllıkta ~%17 tasarruf veya $1’den kullandıkça öde. Ekonomi ve GPT‑4o mini: 100 karakterde 0,2 kontör; Standart 3; Premium 5 (yukarı yuvarlanır).",
    "pricing.hero.intro": "Kontör yüklemenin üç yolu — her yerde aynı kurallar:",
    "pricing.hero.tagMonthly": "Aylık",
    "pricing.hero.tagAnnual": "Yıllık",
    "pricing.hero.annualSaveBadge": "~%17",
    "pricing.hero.tagPaygo": "Kullandıkça öde",
    "pricing.hero.paygoHint": "Daha büyük paketler daha fazla model açar.",
    "pricing.hero.footerMain":
      "Ekonomi ve GPT‑4o mini: 100 karakter başına 0,2 kontör. Standart: 3; Premium: 5 — bloklar üst üste eklenir.",
    "pricing.hero.footerJump": "Kontör kullanımı",
    "pricing.monthly.sectionTitle": "Aylık kontör paketleri",
    "pricing.monthly.sectionLead":
      "Lemon Squeezy ödemesi aktifleştikten sonra abonelik her fatura döneminde yenilenir. Kullanımına uygun paketi (Başlangıç, Büyüme veya Ölçek) seç.",
    "pricing.monthly.starter.name": "Başlangıç",
    "pricing.monthly.starter.price": "$7.99",
    "pricing.monthly.starter.credits": "Ayda 500 kontör",
    "pricing.monthly.starter.desc": "Bireysel hafif kullanım.",
    "pricing.monthly.starter.detail":
      "Her ay 500 kontör yenilenir\nFast AI (1 kontör) veya Pro AI (25 kontör) — üretim başına\nTüm mikro araçlar + AI Concierge dahil\nAylık yenilenir — istediğin zaman iptal",
    "pricing.monthly.growth.name": "Büyüme",
    "pricing.monthly.growth.price": "$9.99",
    "pricing.monthly.growth.credits": "Ayda 1.000 kontör",
    "pricing.monthly.growth.desc": "Düzenli günlük kullanım.",
    "pricing.monthly.growth.detail":
      "Her ay 1.000 kontör yenilenir\nGünlük e-posta, DM ve iş akışları için ideal\nFast AI (1) veya Pro AI (25) — maliyet her zaman butonda\nAylık yenilenir — istediğin zaman iptal",
    "pricing.monthly.scale.name": "Ölçek",
    "pricing.monthly.scale.price": "$19.99",
    "pricing.monthly.scale.credits": "Ayda 5.000 kontör",
    "pricing.monthly.scale.desc": "Yoğun kullanım, otomasyon ve yüksek aylık hacim.",
    "pricing.monthly.scale.detail":
      "Her ay 5.000 kontör yenilenir\nEkipler, otomasyon ve yüksek hacim için\nFast, Pro ve Genius AI (bakiye yeterliyse)\nGüç kullanıcıları için en yüksek kademe",
    "pricing.yearly.sectionTitle": "Yıllık paketler",
    "pricing.yearly.sectionLead":
      "Aylık üç kademeyle aynı; yılda bir kez faturalanır. Yıllık kontör toplamı: 6.000 / 12.000 / 60.000 (ayda 500 / 1.000 / 5.000 ile eşdeğer).",
    "pricing.yearly.starter.price": "$79 / yıl",
    "pricing.yearly.starter.credits": "Yılda 6.000 kontör",
    "pricing.yearly.starter.desc": "Starter aylıkla aynı hacim; efektif aylık maliyet daha düşük.",
    "pricing.yearly.starter.detail":
      "Yılda 6.000 kontör (ayda 500 eşdeğeri)\nBaşlangıç aylık ile aynı araçlar ve AI kademeleri\n12 aylık ödemeye göre ~%17 daha ucuz\nTek ödeme — tüm yıl kullan",
    "pricing.yearly.starter.savings": "12 ay boyunca aylık ödemeye göre ~%17 daha az",
    "pricing.yearly.growth.price": "$99 / yıl",
    "pricing.yearly.growth.credits": "Yılda 12.000 kontör",
    "pricing.yearly.growth.desc": "Growth aylıkla aynı — yıllık taahhüt için uygun.",
    "pricing.yearly.growth.detail":
      "Yılda 12.000 kontör\nBüyüme aylık ile aynı özellikler\nAy ay ödemeye göre ~%17 tasarruf\nYıllık taahhüt için ideal",
    "pricing.yearly.growth.savings": "12 ay boyunca aylık ödemeye göre ~%17 daha az",
    "pricing.yearly.scale.price": "$199 / yıl",
    "pricing.yearly.scale.credits": "Yılda 60.000 kontör",
    "pricing.yearly.scale.desc": "Scale aylık paketle aynı hacim — yüksek kullanımda yıllık ön ödeme için uygun.",
    "pricing.yearly.scale.detail":
      "Yılda 60.000 kontör\nYoğun kullanım için maksimum yıllık havuz\n12× Ölçek aylığa göre ~%17 indirim\nAjanslar ve ekipler için en iyi değer",
    "pricing.yearly.scale.savings": "12 ay boyunca aylık ödemeye göre ~%17 daha az",
    "pricing.pack.detailModalTitle": "{tier} — pakette neler var",
    "pricing.pack.infoButtonAria": "{tier} paket detayları",
    "pricing.paygo.sectionTitle": "Kullandıkça öde (paketler)",
    "pricing.paygo.sectionLead":
      "Tek seferlik kontör; abonelik yok. Daha büyük paketler Standart ve Premium modellere erişim sağlar.",
    "pricing.paygo.detailModalTitle": "{tier} — kullanım detayı",
    "pricing.paygo.infoButtonAria": "{tier} için kullanım detayı",
    "pricing.paygo.closeDetails": "Kapat",
    "pricing.buyNow": "Satın al",
    "pricing.checkoutFailed": "Ödeme başlatılamadı. Lemon Squeezy varyantlarını yapılandır veya tekrar dene.",
    "pricing.checkoutSignInRequired": "Abonelik satın almak için giriş yap.",
    "pricing.checkoutProfileRequired":
      "Satın almadan önce üyelik profilini tamamla — şimdi oraya yönlendiriliyorsun.",
    "pricing.pack.budget": "10 kontör · $1",
    "pricing.pack.standard": "25 kontör · $1,49",
    "pricing.pack.premium": "50 kontör · $1,99",
    "pricing.allPaygoPacks": "10 kontör · $1 · 25 kontör · $1,49 · 50 kontör · $1,99",
    "pricing.tier.budget": "Ekonomik",
    "pricing.tier.standard": "Standart",
    "pricing.tier.premium": "Premium",
    "pricing.tier.budgetPrice": "$1",
    "pricing.tier.standardPrice": "$1,49",
    "pricing.tier.premiumPrice": "$1,99",
    "pricing.tier.budgetSummary": "Tek seferlik · Fast AI (üretim başına 1 kontör)",
    "pricing.tier.standardSummary": "Tek seferlik · Fast + Pro AI (en fazla 25 kontör)",
    "pricing.tier.premiumSummary": "Tek seferlik · Fast, Pro ve Genius AI",
    "pricing.tier.budgetDesc":
      "$1 · anında 10 kontör\nYalnızca Fast AI — mesaj başına 1 kontör\nHızlı düzeltmeler ve kısa parlatma\nAbonelik yok",
    "pricing.tier.standardDesc":
      "$1,49 · anında 25 kontör\nFast AI (1) veya Pro AI (25) — üretim başına\nÖnemli e-postalar ve kritik metinler\nAbonelik yok",
    "pricing.tier.premiumDesc":
      "$1,99 · anında 50 kontör\nFast, Pro ve Genius AI açılır\nSık kullananlar için en iyi kontör/$\nAbonelik yok",
    "pricing.usageGuide.sectionTitle": "Kontör nasıl harcanır (her üretim)",
    "pricing.usageGuide.intro":
      "100 karakterlik bloklar halinde ücret (yukarı yuvarlanır). Yapıştırdığın metin ve araç bağlamı uzunluğa dahil.",
    "pricing.usageGuide.miniBadge": "Ekonomi & mini",
    "pricing.usageGuide.miniTitle": "GPT‑4o mini ve ekonomi",
    "pricing.usageGuide.miniDesc":
      "100 karakter başına 0,2 kontör. Ör.: 100 kr. → 0,2; 500 → 1; 501 → 1,2 kontör.",
    "pricing.usageGuide.scaleSectionTitle": "Standart ve Premium — 100 karakter başına kontör",
    "pricing.usageGuide.standardTitle": "Standart kademe modeller (örnek)",
    "pricing.usageGuide.standardBullets":
      "100 karakter başına 3 kontör\n~500 karakter → ~15 kontör\n~1.000 karakter → ~30 kontör\n~1.500 karakter → ~45 kontör",
    "pricing.usageGuide.premiumTitle": "Premium modeller (örnek)",
    "pricing.usageGuide.premiumBullets":
      "100 karakter başına 5 kontör\n~500 karakter → ~25 kontör\n~1.000 karakter → ~50 kontör\n~1.500 karakter → ~75 kontör",
    "pricing.usageGuide.chartCaption": "Örnek toplamlar",
    "pricing.usageGuide.colShort": "~500 kr.",
    "pricing.usageGuide.colMid": "~1k kr.",
    "pricing.usageGuide.colLong": "~1,5k kr.",
    "pricing.usageGuide.chartHint":
      "Formül: ceil(karakter ÷ 100) × kademe oranı. Çubuklar örnektir.",
    "pricing.usageGuide.footer":
      "Üret’e bastığında kesin tutarı gerçek isteminden (yapıştırma + bağlam) hesaplarız. Her alternatif sürüm aynı kuralı yeniden uygular.",
    "pricing.modelNote.title": "Sınıfa göre AI modelleri",
    "pricing.modelNote.lead":
      "Katalogdaki her model bir faturalandırma sınıfına bağlıdır (araçlardaki seçiciyle aynı isimler). Yukarıdaki kontör oranları sınıfa göre uygulanır; kullandıkça öde paketin hangi sınıfları seçebileceğini sınırlayabilir.",
    "pricing.modelNote.packHint":
      "$1 paket → yalnızca Fast AI · $1,49 paket → Fast + Pro AI · $1,99 paket → üç sınıf (Fast, Pro, Genius).",
    "pricing.sectionFootnote":
      "Sürüm limiti hesap haklarından gelir. Ödeme Lemon Squeezy ile (mağaza live onaylandığında canlı tahsilat).",
    "pricing.dev.title": "Geliştirici modu",
    "pricing.dev.body": "Geliştirme sırasında yerelde kontör ekleyin (yalnızca üretim dışı):",
    "pricing.dev.secretHint":
      ".env.local içinde DEV_TOPUP_SECRET tanımlıysa X-Dev-Topup-Secret veya Authorization: Bearer başlığını gönderin.",
    "pricing.dev.disabled": "Üretimde bu uç devre dışı.",

    "pricingModal.title": "Kontörünü artır",
    "pricingModal.subtitle":
      "Aboneliklerde 7 günlük deneme ve hediye kontör. Denemeyi bitirmeden iptal etmezsen ücretli plan otomatik başlar. Yıllıkta her yenileme yıllık tutarın tek çekimidir. Kontörler her fatura döneminde sıfırlanır.",
    "pricingModal.monthly": "Aylık",
    "pricingModal.yearly": "Yıllık",
    "pricingModal.closeAria": "Kapat",
    "pricingModal.plan.basic": "Temel",
    "pricingModal.plan.pro": "Pro",
    "pricingModal.plan.ultra": "Ultra",
    "pricingModal.mostPopular": "En çok tercih edilen",
    "pricingModal.planCreditsLine": "Denemeden sonra her fatura döneminde ayda {credits} kontör",
    "pricingModal.trialGiftLine": "7 günlük denemede {credits} kontör hediye.",
    "pricingModal.afterTrialNote":
      "Deneme bitmeden iptal etmezsen ücretli abonelik otomatik başlar (Lemon Squeezy yenilemeyi yürütür).",
    "pricingModal.yearSingleCharge":
      "Yıllık: denemeden sonra her yenilemede tek seferde tahsil edilen toplam {total} (≈ {perMonth}/ay).",
    "pricingModal.startTrial": "7 günlük ücretsiz denemeyi başlat",
    "pricingModal.thenMonthly": "Ardından {price}/ay. İstediğin zaman iptal.",
    "pricingModal.thenYearly":
      "Ardından yaklaşık {price}/ay (yıllıkta %20 indirim). İstediğin zaman iptal.",
    "pricingModal.oneTimeTrial": "$1,49 tek seferlik deneme ({credits} kontör)",
    "pricingModal.checkoutFailed": "Ödeme başlatılamadı.",
    "pricingModal.trialAlreadyUsedToast":
      "Bu tarayıcıdan zaten bir abonelik denemesi başlattın.",
    "pricingModal.oneTimePacksTitle": "Tek seferlik kontör paketleri",
    "pricingModal.oneTimePacksLead": "Abonelik yok. Tek ödeme; sipariş ödendikten sonra kontör yüklenir.",

    "notFound.title": "Sayfa bulunamadı",
    "notFound.description": "Aradığın sayfa yok.",
    "errorPage.title": "Bir şeyler ters gitti",
    "errorPage.description": "Beklenmeyen bir hata oluştu. Tekrar dene veya ana sayfaya dön.",
    "errorPage.retry": "Tekrar dene",
    "errors.serverToast": "Sunucu hatası. Kısa süre sonra tekrar dene.",
    "errors.generationFailed": "Üretim başarısız.",
    "errors.signInRequired": "Üretim için lütfen giriş yapın.",
    "errors.noModelResult": "Sonuç dönmedi.",
    "errors.outOfScope": "Bu seçim metninle tam örtüşmüyor. {reason}",
    "errors.outOfScopeReason.generic":
      "Ne yazmak istediğini bir cümleyle düşün; ona en yakın aracı seçmen yeterli.",
    "errors.outOfScopeReason.gift":
      "Hediye isteğini sormak veya o mesajı toparlamak için Garip Metin Düzeltici daha uygun.",
    "errors.outOfScopeTryTool": "Şunu deneyebilirsin: {toolName}.",
    "errors.invalidJson": "Geçersiz istek.",
    "errors.invalidPayload": "Geçersiz araç girdisi.",
    "errors.inputTooLong": "Girdi en fazla {max} karakter olabilir.",
    "errors.extraTooLong": "Ek talimatlar en fazla {max} karakter olabilir.",
    "errors.rateLimit": "Çok fazla istek. Biraz bekle ve tekrar dene.",
    "errors.insufficientCredits":
      "Bu üretim için kontörünüz yetersiz. Paket yükleyin veya daha uygun bir model seçin.",
    "errors.insufficientCreditsDetail":
      "Kontör yetersiz. Bu işlem {required} kontör gerektiriyor; bakiyeniz {balance}.",
    "errors.insufficientCreditsAlt": "Başka bir sürüm için kontörünüz yetersiz.",
    "errors.insufficientCreditsAltDetail":
      "Alternatif sürüm için kontör yetersiz. Gerekli: {required}; bakiye: {balance}.",
    "errors.aiTemperatureUnsupported":
      "Bu model bu ayarı desteklemiyor. Fast veya Pro seviyesini deneyin ya da listeden başka bir model seçin.",
    "legal.termsTitle": "Kullanım şartları",
    "legal.privacyTitle": "Gizlilik politikası",
    "legal.effective": "Yürürlük: {year}-01-01",
    "legal.termsMetaDescription":
      "isendai kullanım şartları. Abonelik ve kontör paketleriyle AI yazım araçları.",
    "legal.privacyMetaDescription":
      "isendai gizlilik politikası. Metninizi ve hesap verilerinizi nasıl topladığımız, kullandığımız ve sakladığımız.",
    "legal.paymentsStub":
      "Paket ve abonelikler Lemon Squeezy ile satılır. Mağaza incelemesi sürerken yalnızca test checkout veya operatör kontörü.",
    "growth.zeroCreditsHint":
      "Bakiye 0: Paketler’deki dev top-up (yalnızca lokal), giriş veya yöneticiden kontör iste.",
    "growth.freeTrial.ctaButton": "İlk mesajını ücretsiz oluştur 🎁",
    "growth.freeTrial.modalTitle": "İlk ücretsiz üretiminizi açın",
    "growth.freeTrial.modalBody":
      "Bu cihazda ilk ücretsiz yapay zeka üretiminizi açmak için e-postanızı girin.",
    "growth.freeTrial.placeholder": "siz@sirket.com",
    "growth.freeTrial.submit": "Aç ve oluştur",
    "growth.freeTrial.cancel": "İptal",
    "growth.freeTrial.invalidEmail": "Lütfen geçerli bir e-posta girin.",
    "growth.freeTrial.deviceAlreadyUsed": "Bu cihazda ücretsiz deneme zaten kullanıldı.",
    "success.pageFallbackTitle": "Sonuç",

    "auth.disabled": "Giriş kapalı",
    "auth.disabledTitle":
      "Supabase yapılandırılmadı. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY (veya SUPABASE_URL ve SUPABASE_ANON_KEY) ekleyip yeniden deploy et veya dev sunucuyu yeniden başlat.",
    "auth.signedInFallback": "Giriş yapıldı",
    "login.title": "Üyelik ve giriş",
    "login.subtitle":
      "E-posta, Google veya Facebook ile giriş yap. İlk başarılı oturumdan sonra kısa bir üyelik profili (ad, ülke, ana kullanım) topluyoruz.",
    "login.send": "Bağlantı gönder",
    "login.sending": "Gönderiliyor…",
    "login.emailDivider": "Ya da e-posta ile giriş",
    "login.oauthTitle": "Hızlı giriş",
    "login.oauthApple": "Apple",
    "login.oauthX": "X (Twitter)",
    "login.oauthLinkedin": "LinkedIn",
    "login.oauthInstagramSub": "Profesyonel Instagram hesabı (Meta)",
    "login.oauthTiktok": "TikTok",
    "login.oauthTiktokSub": "Supabase’te “tiktok” adlı Custom OAuth gerekir",
    "login.oauthSetupHint":
      "Her sağlayıcıyı Supabase → Authentication → Providers içinde aç. Yönlendirme URL’si /auth/callback olmalı",
    "login.oauthFailed": "Sosyal giriş başarısız.",
    "login.oauthCallbackFailed": "Giriş tamamlanamadı. Tekrar dene veya e-posta + şifre kullan.",
    "login.oauthProviderError":
      "Sağlayıcı hata döndü (iptal veya yanlış yapılandırma). Supabase yönlendirme URL’leri ve Google OAuth istemcisini kontrol et.",
    "login.missingSupabase": "Giriş yapılandırılmadı (Supabase anahtarları eksik).",
    "login.membershipEmailTitle": "E-posta",
    "login.membershipEmailBody":
      "Kişisel e-postanı kullan: şifreyle hesap oluştur, şifreyle giriş yap veya tek kullanımlık sihirli bağlantı iste (şifresiz). Girişten sonra üyelik profilini tamamlarsın.",
    "login.membershipSocialTitle": "Google veya Facebook",
    "login.membershipSocialBody":
      "Google veya Facebook ile giriş yap; bir sonraki ekranda üyelik bilgilerini onayla veya ekle.",
    "login.membershipGoogleTitle": "Google hesabı",
    "login.membershipGoogleBody":
      "Google kimliğinle gir; bir sonraki ekranda üyelik bilgilerini onayla veya ekle.",
    "login.membershipFacebookTitle": "Facebook hesabı",
    "login.membershipFacebookBody":
      "Facebook kimliğinle gir; bir sonraki ekranda üyelik bilgilerini onayla veya ekle.",
    "login.membershipInstagramTitle": "Instagram hesabı",
    "login.membershipInstagramBody":
      "Yalnızca profesyonel (işletme veya içerik üreticisi) Instagram hesapları. Instagram e-posta paylaşmaz; girişten sonra üyelik formunu doldurun.",
    "login.oauthInstagram": "Instagram ile devam et",
    "login.oauthInstagramNotConfigured":
      "Instagram girişi henüz yapılandırılmadı. Supabase’te custom:instagram sağlayıcısını ekleyin (README).",
    "login.membershipOtherTitle": "Diğer sağlayıcılar",
    "login.oauthGoogle": "Google ile devam et",
    "login.oauthFacebook": "Facebook ile devam et",
    "login.oauthOtherTitle": "Diğer giriş seçenekleri",
    "login.emailInvalid": "Geçerli bir e-posta gir.",
    "login.emailSent": "Giriş bağlantısı için e-postanı kontrol et.",
    "login.sendFailed": "Bağlantı gönderilemedi.",
    "login.emailRateLimit":
      "Çok kısa sürede çok fazla e-posta isteği gönderildi (Supabase sınırı). Birkaç dakika bekleyip tekrar dene; proje ayarlarında limit artırılabilir veya özel SMTP kullanılabilir.",
    "login.emailPlaceholder": "sen@alanadin.com",
    "login.passwordPlaceholder": "Şifre",
    "login.registerButton": "Hesap oluştur",
    "login.signInPasswordButton": "Şifreyle giriş",
    "login.passwordTooShort": "Şifre en az 6 karakter olmalı.",
    "login.passwordRequired": "Şifreni gir.",
    "login.confirmEmailSent": "Hesabı onaylamak için e-postanı kontrol et, sonra giriş yap.",
    "login.signUpExistingEmail":
      "Bu denemede onay maili gönderilmedi (adres zaten kayıtlı olabilir); gelen kutuda görmemen normal. Şifren varsa «Şifreyle giriş» yap, yoksa alttan tek kullanımlık bağlantı iste — o ayrı bir e-posta. O da gelmezse spam ve Supabase’te SMTP / Auth loglarına bak.",
    "login.invalidCredentialsHint":
      "Giriş başarısız: şifre yanlış olabilir veya e-posta henüz onaylanmamış. «Onay mailini yeniden gönder», «Şifremi unuttum» veya alttan tek kullanımlık bağlantıyı dene.",
    "login.resendConfirmButton": "Onay mailini yeniden gönder",
    "login.resendConfirmToast":
      "Gönderim başarılıysa birkaç dakika içinde e-postanı kontrol et (spam dahil).",
    "login.forgotPasswordButton": "Şifremi unuttum",
    "login.resetEmailSent": "Şifre sıfırlama bağlantısı için e-postanı kontrol et (spam dahil).",
    "login.updatePasswordTitle": "Yeni şifre belirle",
    "login.updatePasswordSubtitle":
      "Sıfırlama bağlantın geçerli. Yeni şifreni kaydet; ardından hesabına devam edebilirsin.",
    "login.newPasswordPlaceholder": "Yeni şifre",
    "login.confirmPasswordPlaceholder": "Yeni şifre (tekrar)",
    "login.updatePasswordSubmit": "Şifreyi kaydet",
    "login.passwordMismatch": "Şifreler eşleşmiyor.",
    "login.passwordUpdated": "Şifre güncellendi.",
    "login.authFailed": "Giriş tamamlanamadı.",
    "login.magicLinkDivider": "Ya da şifresiz giriş",
    "login.legalLead": "Devam ederek",
    "login.legalMid": "ve",
    "login.legalEnd": " kabul etmiş olursun.",

    "profile.title": "Üyelik profili",
    "profile.oauthEmailMissing":
      "Facebook e-posta paylaşmadı. Aşağıdaki e-posta alanına yazıp profili kaydedin.",
    "profile.subtitle":
      "Bu bilgiler hesabında saklanır (Supabase kullanıcı metadata) — destek ve ürün iletişimi için.",
    "profile.backToAccount": "Hesaba dön",
    "profile.editLink": "Üyelik bilgileri",
    "profile.emailLabel": "Hesap e-postası",
    "profile.emailPlaceholder": "ornek@email.com",
    "profile.emailHintOAuth":
      "Facebook e-posta paylaşmadı. Buraya yazın — hesabınıza kaydedeceğiz.",
    "profile.emailConfirmSent":
      "Bu adrese onay bağlantısı gönderdik. E-postanızdaki bağlantıyı açın, gerekirse buraya dönün.",
    "profile.fullName": "Ad soyad",
    "profile.phone": "Telefon (isteğe bağlı)",
    "profile.country": "Ülke / bölge",
    "profile.countryPlaceholder": "Ülke seçin…",
    "profile.addressLabel": "Adres (isteğe bağlı)",
    "profile.addressPlaceholder": "Sokak, bina, daire, semt…",
    "profile.cityLabel": "Şehir (isteğe bağlı)",
    "profile.organization": "Şirket veya okul (isteğe bağlı)",
    "profile.jobTitle": "Rol veya unvan (isteğe bağlı)",
    "profile.useCase": "Ana kullanım",
    "profile.useCasePlaceholder": "Seç…",
    "profile.useCaseWork": "İş ve kariyer",
    "profile.useCasePersonal": "Kişisel işler",
    "profile.useCaseCreator": "İçerik üreticisi / sosyal",
    "profile.useCaseStudent": "Öğrenci / akademik",
    "profile.useCaseAgency": "Ajans / müşteri işi",
    "profile.useCaseOther": "Diğer",
    "profile.defaultAiModel": "Varsayılan AI sürümü",
    "profile.defaultAiModelHint":
      "Bir aracı açtığınızda ön seçilir. Her soruda değiştirebilirsiniz; son seçiminiz bu cihazda hatırlanır.",
    "profile.notes": "Bilmemiz gereken başka bir şey? (isteğe bağlı)",
    "profile.notesPlaceholder": "Bağlam, hedefler, yazdığın diller…",
    "profile.marketingOptIn": "Ara sıra yeni araçlar ve ipuçları için e-posta gönder (isteğe bağlı).",
    "profile.acceptTerms":
      "Bilgilerin doğru olduğunu onaylıyorum; Kullanım Şartları ve Gizlilik Politikası’nı kabul ediyorum.",
    "profile.save": "Kaydet ve devam et",
    "profile.saving": "Kaydediliyor…",
    "profile.saved": "Profil kaydedildi.",
    "profile.errors.required": "Zorunlu alanları doldur.",
    "profile.errors.emailRequired": "E-posta adresini gir.",
    "profile.errors.emailInvalid": "Geçerli bir e-posta adresi gir.",
    "profile.errors.terms": "Devam etmek için şartları kabul etmelisin.",
    "profile.errors.save": "Profil kaydedilemedi. Tekrar dene.",

    "tool.flow.hint":
      "Sırada sonuç sayfası var; üretim kontör bakiyenden düşer. Kontör lazımsa Fiyatlandırma’dan Lemon Squeezy ile satın al.",
    "tool.modelSelectLabel": "Bu istek için yapay zeka modeli",
    "tool.ctaCreditSuffix": " — modele ve uzunluğa göre",
    "tool.priceReference": "Bu model kademesi için kullandıkça öde paketi: {pack}.",
    "tool.pricePackFlex":
      "Tüm paketler: 10 kontör · $1 · 25 kontör · $1,49 · 50 kontör · $1,99. Kontör hesabı için Paketler sayfasına bakın.",
    "tool.validation.empty": "Devam etmeden önce gerekli alanları doldur.",
    "tool.billing.creditOne": "1 kontör",
    "tool.billing.creditsMany": "{n} kontör",
    "tool.billing.paidButton": "{action} · {amount}",

    "errors.toolParamMissing": "Tool parametresi eksik veya geçersiz.",
    "errors.noSavedInput":
      "Bu araç için localStorage içinde kayıtlı giriş bulunamadı. Lütfen geri dönüp tekrar dene.",
    "errors.savedInputParse":
      "Kayıtlı giriş okunamadı. Lütfen geri dönüp tekrar dene.",
    "errors.savedInputMismatch":
      "Kayıtlı giriş istenen araçla eşleşmiyor. Lütfen geri dönüp tekrar dene.",
    "errors.savedInputInvalid":
      "Bu araç için kayıtlı giriş eksik. Lütfen geri dönüp daha fazla detay ekle.",

    "category.work-career.label": "Kariyer Parıltısı",
    "category.crisis-money.label": "Para & Kriz Kurtarma",
    "category.social-dating.label": "Sosyal Kıvılcım",
    "category.freelance-business.label": "Freelance & İş",
    "category.academic-bureaucracy.label": "Okul & Resmi İşler",
    "category.neighbors-living.label": "Ev & Komşular",
    "category.creators-media.label": "Üretici Stüdyosu",
    "category.family-deep-personal.label": "Kalpten Kalbe",

    "tool.corporate-whisperer.label": "Kurumsal Çevirmen",
    "tool.corporate-whisperer.desc":
      "Patronuna ya da müşterine bağırmak mı istiyorsun? Sakın. Buraya filtresiz yaz; biz de kibar, HR‑dostu kurumsal e-postaya çevirelim.",
    "tool.corporate-whisperer.action": "Kurumsala Çevir",
    "tool.corporate-whisperer.placeholder.text":
      `GERÇEKTEN söylemek istediğini yaz... (örn. "Bu tasarım berbat ve brief’i hiç okumamışsın.")`,

    "tool.coverletter-ai.label": "Tek Tık Ön Yazı",
    "tool.coverletter-ai.desc":
      "Her ilana aynı metni yazmaktan yoruldun mu? İlan URL/metnini ve becerilerini yapıştır; ATS uyumlu, özelleştirilmiş bir ön yazı üretelim.",
    "tool.coverletter-ai.action": "Ön Yazı Üret",
    "tool.coverletter-ai.placeholder.jobLink": "İlan metni veya URL yapıştır...",
    "tool.coverletter-ai.placeholder.resume": "CV metnini veya ana becerilerini yapıştır...",

    "tool.dating-roast.label": "Flört Biyosu Roast & Fix",
    "tool.dating-roast.desc":
      "Match yok mu? AI biyonu roastlar, neden işlemediğini söyler ve daha çekici bir versiyon yazar.",
    "tool.dating-roast.action": "Roastla & Düzelt",
    "tool.dating-roast.placeholder.text": "Tinder/Bumble biyonu yapıştır ya da tarzını anlat...",

    "tool.raise-negotiator.label": "Zam Müzakerecisi",
    "tool.raise-negotiator.desc":
      "Başarılarını net bir etkiye çevirip ikna edici bir zam/bütçe artışı e-postasına dönüştürür.",
    "tool.raise-negotiator.action": "Zam E-postası Yaz",
    "tool.raise-negotiator.placeholder.text": "Başarıların, sayılar, etki, sorumluluk ve bağlamı yaz/yapıştır...",

    "tool.graceful-quitter.label": "Nazik İstifacı",
    "tool.graceful-quitter.desc":
      "Köprüleri yakmadan, profesyonel ve kısa bir istifa mektubu hazırlar.",
    "tool.graceful-quitter.action": "İstifa Mektubu Üret",
    "tool.graceful-quitter.placeholder.text": "Pozisyon, son gün, (opsiyonel) sebep ve devir planı...",

    "tool.cold-dm-icebreaker.label": "Soğuk DM Buzkıran",
    "tool.cold-dm-icebreaker.desc":
      "LinkedIn/e‑posta için spam gibi durmayan, kişiselleştirilmiş ve cevap alma ihtimali yüksek kısa mesaj üretir.",
    "tool.cold-dm-icebreaker.action": "Cold DM Yaz",
    "tool.cold-dm-icebreaker.placeholder.text": "Kime yazıyorsun, neden, ne istiyorsun, kişisel detay (varsa)...",

    "tool.micromanager-tamer.label": "Mikro Yönetici Terbiyecisi",
    "tool.micromanager-tamer.desc":
      "Sürekli karışan yönetici/müşteriye nazik ama net sınır çizen mesaj üretir.",
    "tool.micromanager-tamer.action": "Sınır Koy",
    "tool.micromanager-tamer.placeholder.text": "Ne yapıyor, sen ne istiyorsun, ideal çalışma düzenin...",

    "tool.invoice-chaser.label": "Fatura Kovalayıcı",
    "tool.invoice-chaser.desc":
      "Utandırmadan, profesyonel şekilde gecikmiş ödemeyi hatırlatan e-posta yazar.",
    "tool.invoice-chaser.action": "Faturayı Hatırlat",
    "tool.invoice-chaser.placeholder.text": "Fatura no, tutar, vade, önceki takipler (varsa)...",

    "tool.perfect-apology.label": "Mükemmel Özür",
    "tool.perfect-apology.desc":
      "Bahane üretmeyen, sorumluluk alan ve çözüm sunan güçlü bir özür metni yazar.",
    "tool.perfect-apology.action": "Özür Metni Yaz",
    "tool.perfect-apology.placeholder.text": "Ne oldu, kimi etkiledi, nasıl telafi edeceksin...",

    "tool.refund-demander.label": "İade Talepçisi",
    "tool.refund-demander.desc":
      "Tüketici haklarına atıf yapan, resmi ve kararlı bir iade/tazminat e-postası yazar.",
    "tool.refund-demander.action": "İade Talep Et",
    "tool.refund-demander.placeholder.text": "Firma, sipariş detayları, sorun, tarihçe, talebin, kanıt (varsa)...",

    "tool.deadline-diplomat.label": "Deadline Diplomatı",
    "tool.deadline-diplomat.desc":
      "Güven vererek ek süre isteyen, planlı ve profesyonel mesaj üretir.",
    "tool.deadline-diplomat.action": "Ek Süre İste",
    "tool.deadline-diplomat.placeholder.text": "Mevcut deadline, engeller, önerilen yeni tarih, plan/milestone...",

    "tool.landlord-diplomat.label": "Ev Sahibi Diplomatı",
    "tool.landlord-diplomat.desc":
      "Ev sahibi/kiracı anlaşmazlıklarında diplomatik, yasal çerçeveye dikkat eden mesaj üretir.",
    "tool.landlord-diplomat.action": "Mesajı Yaz",
    "tool.landlord-diplomat.placeholder.text": "Şehir/ülke, konu (kira/tamir/depozito), talebin, tarihler...",

    "tool.review-retaliator.label": "Yorum Savunucusu",
    "tool.review-retaliator.desc":
      "Haksız kötü yorumlara sakin, profesyonel ve itibar koruyan cevaplar yazar.",
    "tool.review-retaliator.action": "Yorum Cevabı Yaz",
    "tool.review-retaliator.placeholder.text": "Yorumu yapıştır + olay/politika/faktlar (varsa)...",

    "tool.ghosting-resurrector.label": "Ghosting Diriltici",
    "tool.ghosting-resurrector.desc":
      "Darlamadan cevap aldıracak kısa, düşük baskılı follow-up mesajları üretir.",
    "tool.ghosting-resurrector.action": "Cevap Aldır",
    "tool.ghosting-resurrector.placeholder.text": "Son mesajları yapıştır + ne istiyorsun (buluşma/netlik/kapanış)...",

    "tool.passive-aggressive-decoder.label": "İmalı Mesaj Çözücü",
    "tool.passive-aggressive-decoder.desc":
      "İmalı/toksik alt metni çözümler ve karşı tarafı silahsız bırakan akıllı cevaplar üretir.",
    "tool.passive-aggressive-decoder.action": "Çözümle & Yanıtla",
    "tool.passive-aggressive-decoder.placeholder.text": "Gelen mesaj + ilişki/bağlam...",

    "tool.guilt-free-no.label": "Vicdan Azabı Olmadan “Hayır”",
    "tool.guilt-free-no.desc":
      "Net ama kibar şekilde reddetmeni sağlar; fazla açıklama yapmadan.",
    "tool.guilt-free-no.action": "Nazikçe Reddet",
    "tool.guilt-free-no.placeholder.text": "Neyi reddediyorsun, kim, ne kadar direkt olsun...",

    "tool.delicate-truth.label": "Nazik Gerçek",
    "tool.delicate-truth.desc":
      "Söylemesi zor gerçekleri suçlamadan, nazik bir yüzleşme metnine çevirir.",
    "tool.delicate-truth.action": "Nazikleştir",
    "tool.delicate-truth.placeholder.text": "Ne söylemek istiyorsun, neden, beklediğin sonuç...",

    "tool.co-parenting-peacemaker.label": "Ortak Ebeveyn Barıştırıcısı",
    "tool.co-parenting-peacemaker.desc":
      "Öfkeyi filtreleyip sadece lojistik ve nötr iletişim kurmanı sağlayan mesaj üretir.",
    "tool.co-parenting-peacemaker.action": "Nötrleştir",
    "tool.co-parenting-peacemaker.placeholder.text": "Durum, takvim/saatler, talebin, sınırlar...",

    "tool.friendzone-navigator.label": "Friendzone Navigatörü",
    "tool.friendzone-navigator.desc":
      "Duygularını açarken ya da reddederken arkadaşlığı mahvetmeyen dikkatli mesaj yazar.",
    "tool.friendzone-navigator.action": "Mesajı Yaz",
    "tool.friendzone-navigator.placeholder.text": "Bağlam, ne hissediyorsun, ne istiyorsun/istemiyorsun...",

    "tool.rsvp-diplomat.label": "RSVP Diplomatı",
    "tool.rsvp-diplomat.desc":
      "Önemli bir etkinliğe gidemeyeceğini dram yaratmadan açıklayan sıcak ve net bir mazeret metni yazar.",
    "tool.rsvp-diplomat.action": "Kibarca İptal Et",
    "tool.rsvp-diplomat.placeholder.text": "Etkinlik, davet eden kişi, sebep (opsiyonel), ton tercihi...",

    "tool.corporate-whisperer.title": "Kurumsal Çevirmen",
    "tool.graceful-quitter.title": "Nazik İstifacı",
    "tool.awkward-text-fixer.title": "Garip Metin Düzeltici",

    "tool.linkedin-headline-smith.title": "LinkedIn Başlık Üstadı",

    "tool.corporate-to-caveman-translator.title": "Kurumsaldan Mağaraya Çevirmen",
    "tool.corporate-to-caveman-translator.desc":
      "Uzun, sıkıcı bir kurumsal e-postayı yapıştır. Onu acımasız, çok kısa bir “ilkel gerçeğe” çeviririz.",
  },
};

