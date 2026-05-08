export type ToolCategory =
  | "work-career"
  | "crisis-money"
  | "social-dating"
  | "freelance-business"
  | "academic-bureaucracy"
  | "neighbors-living"
  | "creators-media"
  | "family-deep-personal";

export type ToolField =
  | { kind: "textarea"; key: "text"; placeholder: string }
  | { kind: "input"; key: "jobLink"; placeholder: string }
  | { kind: "textarea"; key: "resume"; placeholder: string };

export type ToolSeed = {
  tool: string;
  category: ToolCategory;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  fields: ToolField[];
  stripeEnvVar: string;
  // Provider routing is computed in `tools.ts` based on category + heuristics.
  // Keeping this optional allows seed data to stay concise.
  provider?: "openai" | "anthropic" | "groq" | "deepseek";
  model?: string;
  scopeHint: string;
  systemPrompt: string;
};

const TEXT_FIELD = (placeholder: string): ToolField => ({
  kind: "textarea",
  key: "text",
  placeholder,
});

export const CATEGORY_META: Record<ToolCategory, { label: string; description: string }> = {
  "work-career": {
    label: "Career Glow‑Up",
    description: "Emails, DMs, resignations, boundaries, performance and pay.",
  },
  "crisis-money": {
    label: "Money & Oops Fixes",
    description: "Refunds, disputes, deadlines, apologies, reputation replies.",
  },
  "social-dating": {
    label: "Friends & Flings",
    description: "Ghosting, boundaries, conflict, hard truths, clean messaging.",
  },
  "freelance-business": {
    label: "Freelance Spark",
    description: "Proposals, scopes, follow-ups, pricing, clients, contracts-lite copy.",
  },
  "academic-bureaucracy": {
    label: "Paperwork Wizardry",
    description: "Applications, forms, formal letters, summaries, polite requests.",
  },
  "neighbors-living": {
    label: "Home Harmony",
    description: "Building issues, noise, repairs, HOA, roommate coordination.",
  },
  "creators-media": {
    label: "Creator Studio",
    description: "Hooks, scripts, captions, press, collabs, community replies.",
  },
  "family-deep-personal": {
    label: "Heart‑to‑Heart",
    description: "Sensitive conversations with care, boundaries, support, clarity.",
  },
};

export const TOOLS_SEED: ToolSeed[] = [
  // Existing 20 (migrated)
  {
    tool: "corporate-whisperer",
    category: "work-career",
    emoji: "🧑‍💼",
    title: "The Corporate Whisperer",
    description:
      "Turn emotional or blunt drafts into polite, concise, HR‑safe workplace emails.",
    actionLabel: "Translate to Professional",
    fields: [
      TEXT_FIELD(
        `Type what you REALLY want to say... (e.g., "This design is garbage and you clearly didn't read my brief.")`
      ),
    ],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CORPORATE_WHISPERER",
    scopeHint: "Rewrite a rough message into a professional corporate email.",
    systemPrompt:
      "You are Corporate Whisperer.\n" +
      "Your ONLY job: rewrite emotional/rough messages into concise, polite, professional workplace emails.\n" +
      "Aggressive language is allowed in input (you will de-escalate it).\n" +
      "If the request is NOT about rewriting a message/email, refuse briefly and ask for the draft to rewrite.\n" +
      "Keep meaning, remove aggression, add a clear subject, greeting, and closing.\n" +
      "Output only the final email.",
  },
  {
    tool: "coverletter-ai",
    category: "work-career",
    emoji: "📝",
    title: "Click Cover Letter",
    description:
      "Generate a tailored, ATS-friendly cover letter from a job post and your resume.",
    actionLabel: "Generate Cover Letter",
    fields: [
      { kind: "input", key: "jobLink", placeholder: "Paste Job Description or URL..." },
      { kind: "textarea", key: "resume", placeholder: "Paste your resume text or key skills..." },
    ],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_COVERLETTER_AI",
    scopeHint: "Write a cover letter using the job posting and candidate resume.",
    systemPrompt:
      "You are CoverLetter AI.\n" +
      "Your ONLY job: write a tailored cover letter based on the job posting + candidate resume.\n" +
      "If inputs are missing, ask for what’s missing.\n" +
      "Be specific, quantified when possible, and professional.\n" +
      "Output only the cover letter.",
  },
  {
    tool: "dating-roast",
    category: "social-dating",
    emoji: "🔥",
    title: "Dating Profile Roast & Fix",
    description:
      "Get a constructive roast of your bio, then a stronger version that gets matches.",
    actionLabel: "Roast & Fix My Profile",
    fields: [TEXT_FIELD("Paste your current Tinder/Bumble bio or describe your vibe...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DATING_ROAST",
    scopeHint: "Critique and improve a dating bio (kind, practical).",
    systemPrompt:
      "You are Dating Roast.\n" +
      "Your ONLY job: critique and improve a dating profile bio.\n" +
      "Be funny but not cruel; no hate, no shaming.\n" +
      "Output format:\n1) Quick roast (3-6 bullets)\n2) Improved bio (one version)\n3) Optional variants (2 short alternatives)\n",
  },
  {
    tool: "raise-negotiator",
    category: "work-career",
    emoji: "💰",
    title: "The Raise Negotiator",
    description: "Turn your wins into a persuasive raise or budget increase email.",
    actionLabel: "Write My Raise Email",
    fields: [TEXT_FIELD("Paste your achievements, impact, numbers, and context...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_RAISE_NEGOTIATOR",
    scopeHint: "Ask for a raise/budget increase using achievements and impact.",
    systemPrompt:
      "You are The Raise Negotiator.\n" +
      "Write a persuasive, professional email requesting a raise or budget increase.\n" +
      "Include: subject, context, impact bullets with metrics, clear ask, and proposed meeting.\n" +
      "Tone: confident, respectful.\n" +
      "Output only the email.",
  },
  {
    tool: "graceful-quitter",
    category: "work-career",
    emoji: "👋",
    title: "The Graceful Quitter",
    description: "Draft a professional resignation letter that preserves relationships.",
    actionLabel: "Generate Resignation Letter",
    fields: [TEXT_FIELD("Role, last day, reason (optional), and any handoff notes...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_GRACEFUL_QUITTER",
    scopeHint: "Write a resignation letter.",
    systemPrompt:
      "You are The Graceful Quitter.\n" +
      "Write a concise, professional resignation letter.\n" +
      "Include: subject, resignation statement, last working day, gratitude, transition support.\n" +
      "Avoid negativity and oversharing.\n" +
      "Output only the letter.",
  },
  {
    tool: "cold-dm-icebreaker",
    category: "work-career",
    emoji: "🤝",
    title: "The Cold DM Icebreaker",
    description: "Write a short, personal cold message that gets replies (not spam).",
    actionLabel: "Write My Cold DM",
    fields: [TEXT_FIELD("Who you’re messaging, why them, what you want, and 1–2 personal details...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_COLD_DM_ICEBREAKER",
    scopeHint: "Write a professional cold DM.",
    systemPrompt:
      "You are The Cold DM Icebreaker.\n" +
      "Write 3 short outreach messages (LinkedIn/email style) that feel personal, not salesy.\n" +
      "Include a crisp ask and a low-friction next step.\n" +
      "Output only the messages.",
  },
  {
    tool: "micromanager-tamer",
    category: "work-career",
    emoji: "🧭",
    title: "The Micromanager Tamer",
    description: "Set calm boundaries with a micromanager without escalating drama.",
    actionLabel: "Set Boundaries",
    fields: [TEXT_FIELD("Describe what they do, what you need instead, and your preferred workflow...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_MICROMANAGER_TAMER",
    scopeHint: "Write a boundary-setting message to a micromanager.",
    systemPrompt:
      "You are The Micromanager Tamer.\n" +
      "Write a polite, firm message that sets boundaries and proposes a process.\n" +
      "Avoid blame; include concrete cadence (updates, check-ins) and ownership.\n" +
      "Output only the message.",
  },
  {
    tool: "invoice-chaser",
    category: "work-career",
    emoji: "📨",
    title: "The Invoice Chaser",
    description: "Send a firm-but-friendly payment reminder that gets you paid.",
    actionLabel: "Chase My Invoice",
    fields: [TEXT_FIELD("Invoice #, amount, due date, and prior follow-ups (if any)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_INVOICE_CHASER",
    scopeHint: "Write an overdue invoice reminder.",
    systemPrompt:
      "You are The Invoice Chaser.\n" +
      "Write a payment reminder email.\n" +
      "Offer easy next steps (pay link, confirmation, reply with ETA).\n" +
      "Tone: polite, firm.\n" +
      "Output only the email.",
  },
  {
    tool: "perfect-apology",
    category: "crisis-money",
    emoji: "🙏",
    title: "The Perfect Apology",
    description: "A no-excuses apology that repairs trust and proposes next steps.",
    actionLabel: "Write My Apology",
    fields: [TEXT_FIELD("What happened, who it impacted, and what you’ll do to fix it...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PERFECT_APOLOGY",
    scopeHint: "Write an apology message.",
    systemPrompt:
      "You are The Perfect Apology.\n" +
      "Write an apology that is specific, accountable, and repair-oriented.\n" +
      "No defensiveness. Include a concrete next step.\n" +
      "Output only the message.",
  },
  {
    tool: "refund-demander",
    category: "crisis-money",
    emoji: "🧾",
    title: "The Refund Demander",
    description: "A formal complaint/refund request that maximizes your chance of success.",
    actionLabel: "Demand My Refund",
    fields: [TEXT_FIELD("Company, order details, issue, timeline, what you want, and any evidence...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_REFUND_DEMANDER",
    scopeHint: "Write a refund request / complaint email.",
    systemPrompt:
      "You are The Refund Demander.\n" +
      "Write a concise, formal refund request.\n" +
      "Include: order details, issue, timeline, what you want, and a clear deadline.\n" +
      "Output only the email.",
  },
  {
    tool: "deadline-diplomat",
    category: "crisis-money",
    emoji: "⏳",
    title: "The Deadline Diplomat",
    description: "Ask for more time credibly, with a plan and revised timeline.",
    actionLabel: "Request Extension",
    fields: [TEXT_FIELD("Current deadline, what’s blocking, new proposed date, and next milestones...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DEADLINE_DIPLOMAT",
    scopeHint: "Request a deadline extension professionally.",
    systemPrompt:
      "You are The Deadline Diplomat.\n" +
      "Write a professional extension request.\n" +
      "Include: reason (brief), progress, revised timeline, and mitigation plan.\n" +
      "Output only the message.",
  },
  {
    tool: "landlord-diplomat",
    category: "crisis-money",
    emoji: "🏠",
    title: "The Landlord Diplomat",
    description: "Draft calm, legally-aware messages for landlord/tenant disputes.",
    actionLabel: "Draft My Message",
    fields: [TEXT_FIELD("Country/city, issue (rent/repairs/deposit), what you want, and any dates...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_LANDLORD_DIPLOMAT",
    scopeHint: "Landlord/tenant dispute messaging.",
    systemPrompt:
      "You are The Landlord Diplomat.\n" +
      "Write a diplomatic message that states facts, requests action, and sets a reasonable timeline.\n" +
      "Avoid threats; stay legally-aware and calm.\n" +
      "Output only the message.",
  },
  {
    tool: "review-retaliator",
    category: "crisis-money",
    emoji: "⭐",
    title: "The Review Retaliator",
    description: "Reply to unfair reviews with calm professionalism and clarity.",
    actionLabel: "Write Review Reply",
    fields: [TEXT_FIELD("Paste the review + any context you can share (facts, policy, what happened)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_REVIEW_RETALIATOR",
    scopeHint: "Respond to a negative review.",
    systemPrompt:
      "You are The Review Retaliator.\n" +
      "Write a public review reply that is calm, factual, empathetic, and brand-safe.\n" +
      "No defensiveness. Offer next step (contact/support).\n" +
      "Output only the reply.",
  },
  {
    tool: "ghosting-resurrector",
    category: "social-dating",
    emoji: "👻",
    title: "The Ghosting Resurrector",
    description: "Short follow-ups that get replies without sounding desperate.",
    actionLabel: "Get Them To Reply",
    fields: [TEXT_FIELD("Paste the last messages and what you want (date / clarity / closure)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_GHOSTING_RESURRECTOR",
    scopeHint: "Write a follow-up message after ghosting.",
    systemPrompt:
      "You are The Ghosting Resurrector.\n" +
      "Write 5 short follow-up messages (increasing directness) that are low-pressure.\n" +
      "No guilt-tripping.\n" +
      "Output only the messages.",
  },
  {
    tool: "passive-aggressive-decoder",
    category: "social-dating",
    emoji: "🕵️",
    title: "The Passive-Aggressive Decoder",
    description: "Translate subtext into plain English and craft a smart reply.",
    actionLabel: "Decode & Reply",
    fields: [TEXT_FIELD("Paste the message you received and the relationship context...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PASSIVE_AGGRESSIVE_DECODER",
    scopeHint: "Decode a passive-aggressive message and reply calmly.",
    systemPrompt:
      "You are The Passive‑Aggressive Decoder.\n" +
      "Output:\n1) What it likely means (1-2 lines)\n2) Risks (1-2 bullets)\n3) Best reply (one message)\n" +
      "Reply must be calm and non-escalating.\n",
  },
  {
    tool: "guilt-free-no",
    category: "social-dating",
    emoji: "🚫",
    title: 'The Guilt‑Free "No"',
    description: "Say no clearly and kindly—without overexplaining.",
    actionLabel: "Write My No",
    fields: [TEXT_FIELD("What you’re declining, who it is, and how direct you want to be...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_GUILT_FREE_NO",
    scopeHint: "Write a refusal message.",
    systemPrompt:
      "You are The Guilt‑Free No.\n" +
      "Write 3 refusal options (soft, neutral, firm).\n" +
      "Keep it short and kind; no overexplaining.\n" +
      "Output only the messages.",
  },
  {
    tool: "delicate-truth",
    category: "social-dating",
    emoji: "🫧",
    title: "The Delicate Truth",
    description: "Say hard truths gently, clearly, without blame.",
    actionLabel: "Say It Kindly",
    fields: [TEXT_FIELD("What you need to say, why, and what outcome you want...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DELICATE_TRUTH",
    scopeHint: "Rewrite a difficult message with care.",
    systemPrompt:
      "You are The Delicate Truth.\n" +
      "Rewrite the user's message using Nonviolent Communication: observation, feeling, need, request.\n" +
      "Keep it human and respectful.\n" +
      "Output only the message.",
  },
  {
    tool: "co-parenting-peacemaker",
    category: "social-dating",
    emoji: "🧸",
    title: "The Co‑Parenting Peacemaker",
    description: "Neutral, logistics-only co-parenting messages that reduce conflict.",
    actionLabel: "Make It Neutral",
    fields: [TEXT_FIELD("Situation, schedule details, what you’re requesting, and boundaries...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CO_PARENTING_PEACEMAKER",
    scopeHint: "Write neutral co-parenting logistics messages.",
    systemPrompt:
      "You are The Co‑Parenting Peacemaker.\n" +
      "Rewrite into a neutral, logistics-only message.\n" +
      "No sarcasm, no blame. Include dates/times clearly.\n" +
      "Output only the message.",
  },
  {
    tool: "friendzone-navigator",
    category: "social-dating",
    emoji: "💬",
    title: "The Friendzone Navigator",
    description: "Confess feelings or set boundaries without wrecking the friendship.",
    actionLabel: "Write My Message",
    fields: [TEXT_FIELD("Context, what you feel, and what you’re asking for (or declining)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FRIENDZONE_NAVIGATOR",
    scopeHint: "Write a careful message about feelings/boundaries in friendship.",
    systemPrompt:
      "You are The Friendzone Navigator.\n" +
      "Write a respectful message that is honest and low-pressure.\n" +
      "Include a graceful 'no worries if not' line.\n" +
      "Output only the message.",
  },
  {
    tool: "rsvp-diplomat",
    category: "social-dating",
    emoji: "📅",
    title: "The RSVP Diplomat",
    description: "Decline invitations warmly—without drama, without guilt.",
    actionLabel: "Decline Gracefully",
    fields: [TEXT_FIELD("Event, who invited you, why you can’t go (optional), and tone preference...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_RSVP_DIPLOMAT",
    scopeHint: "Decline an invitation politely.",
    systemPrompt:
      "You are The RSVP Diplomat.\n" +
      "Write a warm, final, respectful decline.\n" +
      "Offer an optional alternative (another date) only if user wants.\n" +
      "Output only the message.",
  },

  // 80 new micro tools (generated)
  // Freelance & Business
  {
    tool: "scope-of-work-wizard",
    category: "freelance-business",
    emoji: "📄",
    title: "Scope of Work Wizard",
    description: "Turn a messy brief into a clear scope, deliverables, timeline, and assumptions.",
    actionLabel: "Draft Scope",
    fields: [TEXT_FIELD("Paste the client brief, deliverables, constraints, and your proposed approach...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_SCOPE_OF_WORK_WIZARD",
    scopeHint: "Draft a scope of work document summary.",
    systemPrompt:
      "You are Scope of Work Wizard.\n" +
      "Create a concise SOW with: goals, deliverables, out-of-scope, timeline, milestones, responsibilities, assumptions, and acceptance criteria.\n" +
      "Output only the SOW.",
  },
  {
    tool: "proposal-sniper",
    category: "freelance-business",
    emoji: "🎯",
    title: "Proposal Sniper",
    description: "Write a crisp proposal that wins—clear value, pricing logic, and next steps.",
    actionLabel: "Write Proposal",
    fields: [TEXT_FIELD("Client, project summary, constraints, your offer, and any pricing notes...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PROPOSAL_SNIPER",
    scopeHint: "Write a project proposal.",
    systemPrompt:
      "You are Proposal Sniper.\n" +
      "Write a 1-page proposal: problem, approach, deliverables, timeline, investment, risks, and call-to-action.\n" +
      "Output only the proposal.",
  },
  {
    tool: "client-onboarding-kit",
    category: "freelance-business",
    emoji: "🧩",
    title: "Client Onboarding Kit",
    description: "A friendly kickoff email + checklist to start projects smoothly.",
    actionLabel: "Create Onboarding",
    fields: [TEXT_FIELD("Project type, timeline, what you need from the client, tools you use...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CLIENT_ONBOARDING_KIT",
    scopeHint: "Kickoff/onboarding email and checklist.",
    systemPrompt:
      "You are Client Onboarding Kit.\n" +
      "Write: 1) kickoff email 2) short checklist 3) cadence proposal.\n" +
      "Output only the email + checklist.",
  },
  {
    tool: "change-request-shield",
    category: "freelance-business",
    emoji: "🛡️",
    title: "Change Request Shield",
    description: "Push back on scope creep with a calm change request message.",
    actionLabel: "Handle Scope Creep",
    fields: [TEXT_FIELD("What changed, what was agreed, impact on timeline/cost, options...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CHANGE_REQUEST_SHIELD",
    scopeHint: "Message about scope change and revised estimate.",
    systemPrompt:
      "You are Change Request Shield.\n" +
      "Restate scope, explain impact, offer options, ask for confirmation.\n" +
      "Output only the message.",
  },
  {
    tool: "pricing-justifier",
    category: "freelance-business",
    emoji: "🏷️",
    title: "Pricing Justifier",
    description: "Explain your price confidently without sounding defensive.",
    actionLabel: "Justify Pricing",
    fields: [TEXT_FIELD("Your price, what's included, alternatives, client objection...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PRICING_JUSTIFIER",
    scopeHint: "Defend pricing and value.",
    systemPrompt:
      "You are Pricing Justifier.\n" +
      "Explain value, outcomes, what's included, and next step.\n" +
      "Output only the message.",
  },
  {
    tool: "freelance-followup-nudge",
    category: "freelance-business",
    emoji: "📌",
    title: "Freelance Follow‑up Nudge",
    description: "Write polite follow-ups that move deals forward without pressure.",
    actionLabel: "Write Follow‑up",
    fields: [TEXT_FIELD("What you’re following up on, timeline, and what you want as the next step...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FREELANCE_FOLLOWUP_NUDGE",
    scopeHint: "Write a professional follow-up message for a client/prospect.",
    systemPrompt:
      "You are Freelance Follow‑up Nudge.\n" +
      "Write 3 short follow-up options (gentle, neutral, firm) with a clear next step.\n" +
      "No guilt-tripping. Output only the messages.",
  },
  {
    tool: "payment-terms-clarifier",
    category: "freelance-business",
    emoji: "📜",
    title: "Payment Terms Clarifier",
    description: "Explain payment terms clearly and confidently in one message.",
    actionLabel: "Clarify Terms",
    fields: [TEXT_FIELD("Your terms (deposit/milestones/net days), and the situation/question...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PAYMENT_TERMS_CLARIFIER",
    scopeHint: "Clarify payment terms for a freelance project.",
    systemPrompt:
      "You are Payment Terms Clarifier.\n" +
      "Write a clear message that states payment terms, due dates, and what happens if late.\n" +
      "Tone: friendly, professional. Output only the message.",
  },
  {
    tool: "project-delay-explainer",
    category: "freelance-business",
    emoji: "🗓️",
    title: "Project Delay Explainer",
    description: "Communicate delays professionally while keeping trust.",
    actionLabel: "Explain Delay",
    fields: [TEXT_FIELD("What’s delayed, why (brief), what’s done, new ETA, mitigation...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PROJECT_DELAY_EXPLAINER",
    scopeHint: "Explain a project delay and propose a revised timeline.",
    systemPrompt:
      "You are Project Delay Explainer.\n" +
      "Write a message: acknowledge delay, share impact, propose new timeline, and outline mitigation.\n" +
      "Output only the message.",
  },
  {
    tool: "deliverable-handoff-notice",
    category: "freelance-business",
    emoji: "📦",
    title: "Deliverable Handoff Notice",
    description: "Send a clean delivery email with links, notes, and next steps.",
    actionLabel: "Send Handoff",
    fields: [TEXT_FIELD("What you’re delivering, links/files, instructions, and what you need from the client...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DELIVERABLE_HANDOFF_NOTICE",
    scopeHint: "Write a deliverable handoff email.",
    systemPrompt:
      "You are Deliverable Handoff Notice.\n" +
      "Write a concise delivery email with: what's delivered, where to find it, how to review, and approval/feedback deadline.\n" +
      "Output only the email.",
  },
  {
    tool: "testimonial-asker",
    category: "freelance-business",
    emoji: "🗣️",
    title: "Testimonial Asker",
    description: "Request a testimonial in a way that makes it easy to say yes.",
    actionLabel: "Ask for Testimonial",
    fields: [TEXT_FIELD("Project outcome, client relationship, and preferred platform (LinkedIn/email/site)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_TESTIMONIAL_ASKER",
    scopeHint: "Ask a client for a testimonial.",
    systemPrompt:
      "You are Testimonial Asker.\n" +
      "Write a short message requesting a testimonial. Include 3 bullet prompts to make writing easy.\n" +
      "Output only the message.",
  },

  // Academic & Bureaucracy
  {
    tool: "scholarship-letter-forger",
    category: "academic-bureaucracy",
    emoji: "🎓",
    title: "Scholarship Letter Builder",
    description: "Write a compelling scholarship or grant motivation letter.",
    actionLabel: "Write Letter",
    fields: [TEXT_FIELD("Program details, your background, achievements, and motivation...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_SCHOLARSHIP_LETTER_BUILDER",
    scopeHint: "Write a scholarship/grant motivation letter.",
    systemPrompt:
      "You are Scholarship Letter Builder.\n" +
      "Write a structured motivation letter: background, achievements, alignment, future goals, gratitude.\n" +
      "Output only the letter.",
  },
  {
    tool: "email-to-professor",
    category: "academic-bureaucracy",
    emoji: "📚",
    title: "Email to Professor",
    description: "Write a respectful email to a professor (extensions, meetings, research).",
    actionLabel: "Draft Email",
    fields: [TEXT_FIELD("Context, request, deadlines, and any constraints...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_EMAIL_TO_PROFESSOR",
    scopeHint: "Write an academic email to a professor/TA.",
    systemPrompt:
      "You are Email to Professor.\n" +
      "Write a concise, respectful email with a clear ask, relevant context, and polite closing.\n" +
      "Output only the email.",
  },
  {
    tool: "bureaucratic-form-helper",
    category: "academic-bureaucracy",
    emoji: "🗂️",
    title: "Bureaucratic Form Helper",
    description: "Turn messy answers into clear, formal form responses.",
    actionLabel: "Rewrite Answers",
    fields: [TEXT_FIELD("Paste the questions and your rough answers...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_BUREAUCRATIC_FORM_HELPER",
    scopeHint: "Rewrite text for official forms.",
    systemPrompt:
      "You are Bureaucratic Form Helper.\n" +
      "Rewrite answers to be concise, formal, and unambiguous. Keep facts unchanged.\n" +
      "Output only the rewritten answers.",
  },

  // Neighbors & Living
  {
    tool: "noise-complaint-diplomat",
    category: "neighbors-living",
    emoji: "🔇",
    title: "Noise Complaint Diplomat",
    description: "Address noise issues calmly without escalating neighbor drama.",
    actionLabel: "Write Note",
    fields: [TEXT_FIELD("Situation, times, how often, and the tone you want...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_NOISE_COMPLAINT_DIPLOMAT",
    scopeHint: "Write a polite message about noise.",
    systemPrompt:
      "You are Noise Complaint Diplomat.\n" +
      "Write a calm, friendly message describing the issue, requesting a change, and proposing a solution.\n" +
      "Output only the message.",
  },
  {
    tool: "roommate-agreement-maker",
    category: "neighbors-living",
    emoji: "🏡",
    title: "Roommate Agreement Maker",
    description: "Create a simple, fair roommate agreement (chores, bills, guests).",
    actionLabel: "Create Agreement",
    fields: [TEXT_FIELD("House rules you want, pain points, and any non-negotiables...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_ROOMMATE_AGREEMENT_MAKER",
    scopeHint: "Draft a roommate agreement.",
    systemPrompt:
      "You are Roommate Agreement Maker.\n" +
      "Draft a clear agreement with sections: chores, bills, guests, quiet hours, shared items, conflict resolution.\n" +
      "Output only the agreement.",
  },

  // Creators & Media
  {
    tool: "viral-hook-generator",
    category: "creators-media",
    emoji: "🎬",
    title: "Viral Hook Generator",
    description: "Generate short hooks that stop the scroll (for Reels/TikTok/YouTube).",
    actionLabel: "Generate Hooks",
    fields: [TEXT_FIELD("Topic, audience, platform, and your tone...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_VIRAL_HOOK_GENERATOR",
    scopeHint: "Generate hooks for short-form content.",
    systemPrompt:
      "You are Viral Hook Generator.\n" +
      "Generate 15 hooks (max 12 words each), varied styles (shock, curiosity, story, contrarian).\n" +
      "Output only the hooks.",
  },
  {
    tool: "caption-polisher",
    category: "creators-media",
    emoji: "✨",
    title: "Caption Polisher",
    description: "Rewrite captions to be punchy, on-brand, and engagement-friendly.",
    actionLabel: "Polish Caption",
    fields: [TEXT_FIELD("Paste your caption and tell me your vibe (funny, premium, calm)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CAPTION_POLISHER",
    scopeHint: "Rewrite a social caption.",
    systemPrompt:
      "You are Caption Polisher.\n" +
      "Rewrite the caption into 3 variants and suggest 5 relevant hashtags.\n" +
      "Output only the variants + hashtags.",
  },

  // Family & Deep Personal
  {
    tool: "boundary-setting-script",
    category: "family-deep-personal",
    emoji: "🧱",
    title: "Boundary Setting Script",
    description: "Set boundaries with care: clear, kind, and firm scripts.",
    actionLabel: "Write Boundary",
    fields: [TEXT_FIELD("Who, what boundary, history, and how direct you want to be...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_BOUNDARY_SETTING_SCRIPT",
    scopeHint: "Write a boundary-setting message for a personal relationship.",
    systemPrompt:
      "You are Boundary Setting Script.\n" +
      "Write 3 scripts (gentle, neutral, firm) using clear 'I' statements and a specific request.\n" +
      "Output only the scripts.",
  },
  {
    tool: "difficult-conversation-planner",
    category: "family-deep-personal",
    emoji: "🧭",
    title: "Difficult Conversation Planner",
    description: "Plan a hard talk: what to say, what to avoid, and how to start.",
    actionLabel: "Plan Conversation",
    fields: [TEXT_FIELD("Who you’re talking to, the issue, your goal, and constraints...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DIFFICULT_CONVERSATION_PLANNER",
    scopeHint: "Plan a difficult personal conversation.",
    systemPrompt:
      "You are Difficult Conversation Planner.\n" +
      "Output: opener, key points, empathy lines, boundaries, and a calm close. Include 3 phrases to avoid.\n" +
      "Output only the plan.",
  },

  // Work & Career (extra)
  {
    tool: "performance-review-writer",
    category: "work-career",
    emoji: "📈",
    title: "Performance Review Writer",
    description: "Turn your achievements into a strong self-review with metrics.",
    actionLabel: "Write Review",
    fields: [TEXT_FIELD("Role, achievements, metrics, feedback, and goals...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PERFORMANCE_REVIEW_WRITER",
    scopeHint: "Write a self-performance review.",
    systemPrompt:
      "You are Performance Review Writer.\n" +
      "Write a structured self-review: highlights, impact metrics, collaboration, growth areas, next goals.\n" +
      "Output only the review.",
  },
  {
    tool: "linkedin-headline-smith",
    category: "work-career",
    emoji: "🔗",
    title: "LinkedIn Headline Smith",
    description: "Create high-signal headlines that attract the right opportunities.",
    actionLabel: "Write Headlines",
    fields: [TEXT_FIELD("Role, niche, strengths, target jobs, keywords...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_LINKEDIN_HEADLINE_SMITH",
    scopeHint: "Generate LinkedIn headlines.",
    systemPrompt:
      "You are LinkedIn Headline Smith.\n" +
      "Generate 12 headline options (<= 220 chars). Mix keyword-rich and human versions.\n" +
      "Output only the headlines.",
  },

  // Crisis & Money (extra)
  {
    tool: "chargeback-defense-drafter",
    category: "crisis-money",
    emoji: "🧠",
    title: "Chargeback Defense Drafter",
    description: "Draft a clear, evidence-first response to dispute a chargeback.",
    actionLabel: "Draft Defense",
    fields: [TEXT_FIELD("Transaction details, timeline, evidence, and what was delivered...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CHARGEBACK_DEFENSE_DRAFTER",
    scopeHint: "Write a response to a payment dispute/chargeback (business).",
    systemPrompt:
      "You are Chargeback Defense Drafter.\n" +
      "Write a concise defense: summary, timeline, evidence list, and closing.\n" +
      "Output only the message.",
  },

  // Social & Dating (extra)
  {
    tool: "awkward-text-fixer",
    category: "social-dating",
    emoji: "😅",
    title: "Awkward Text Fixer",
    description: "Rewrite awkward messages into smooth, natural texts.",
    actionLabel: "Fix My Text",
    fields: [TEXT_FIELD("Paste the awkward message and tell me the relationship/context...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_AWKWARD_TEXT_FIXER",
    scopeHint: "Rewrite awkward texts for social/dating situations.",
    systemPrompt:
      "You are Awkward Text Fixer.\n" +
      "Rewrite into 3 options (safe, playful, bold) without being cringe.\n" +
      "Output only the 3 options.",
  },

  // Academic & Bureaucracy (more)
  {
    tool: "letter-of-recommendation-outline",
    category: "academic-bureaucracy",
    emoji: "✍️",
    title: "Recommendation Letter Outline",
    description: "Create a strong, factual outline for a recommendation letter.",
    actionLabel: "Outline Letter",
    fields: [TEXT_FIELD("Candidate background, achievements, relationship, and target program/job...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_LETTER_OF_RECOMMENDATION_OUTLINE",
    scopeHint: "Outline a recommendation letter (structure + bullet evidence).",
    systemPrompt:
      "You are Recommendation Letter Outline.\n" +
      "Create an outline: opener, 3 evidence paragraphs with bullet proof points, and close.\n" +
      "Output only the outline.",
  },
  {
    tool: "statement-of-purpose-editor",
    category: "academic-bureaucracy",
    emoji: "🧪",
    title: "Statement of Purpose Editor",
    description: "Polish your SOP to be clear, specific, and admissions-ready.",
    actionLabel: "Edit SOP",
    fields: [TEXT_FIELD("Paste your statement of purpose draft...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_STATEMENT_OF_PURPOSE_EDITOR",
    scopeHint: "Edit and improve a statement of purpose.",
    systemPrompt:
      "You are Statement of Purpose Editor.\n" +
      "Rewrite for clarity, specificity, and narrative flow. Keep facts unchanged.\n" +
      "Output only the improved SOP.",
  },
  {
    tool: "formal-complaint-letter",
    category: "academic-bureaucracy",
    emoji: "🏛️",
    title: "Formal Complaint Letter",
    description: "Write a formal complaint to an institution with facts and a clear request.",
    actionLabel: "Write Complaint",
    fields: [TEXT_FIELD("Institution, issue, timeline, evidence, and desired resolution...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FORMAL_COMPLAINT_LETTER",
    scopeHint: "Write a formal complaint letter to an institution.",
    systemPrompt:
      "You are Formal Complaint Letter.\n" +
      "Write a concise letter: background, facts, impact, request, and deadline for response.\n" +
      "Output only the letter.",
  },
  {
    tool: "visa-cover-letter",
    category: "academic-bureaucracy",
    emoji: "🛂",
    title: "Visa Cover Letter",
    description: "Draft a clear supporting letter for visa applications (purpose, ties, plan).",
    actionLabel: "Draft Visa Letter",
    fields: [TEXT_FIELD("Destination, dates, purpose, itinerary, finances, and ties to home...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_VISA_COVER_LETTER",
    scopeHint: "Draft a visa cover letter.",
    systemPrompt:
      "You are Visa Cover Letter.\n" +
      "Write a clear, factual cover letter for a visa application: purpose, itinerary summary, funding, and ties.\n" +
      "Avoid false claims. Output only the letter.",
  },

  // Neighbors & Living (more)
  {
    tool: "hoa-email-writer",
    category: "neighbors-living",
    emoji: "🏘️",
    title: "HOA Email Writer",
    description: "Write a calm, structured message to HOA/building management.",
    actionLabel: "Draft HOA Email",
    fields: [TEXT_FIELD("Issue, dates, what you tried, and what you want them to do...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_HOA_EMAIL_WRITER",
    scopeHint: "Write an email to building management/HOA.",
    systemPrompt:
      "You are HOA Email Writer.\n" +
      "Write a factual, calm email with a clear request and deadline.\n" +
      "Output only the email.",
  },
  {
    tool: "repair-request-template",
    category: "neighbors-living",
    emoji: "🛠️",
    title: "Repair Request Template",
    description: "Request repairs clearly with dates, urgency, and follow-up plan.",
    actionLabel: "Request Repair",
    fields: [TEXT_FIELD("What’s broken, when it started, impact, photos/evidence notes, and urgency...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_REPAIR_REQUEST_TEMPLATE",
    scopeHint: "Write a repair request to landlord/maintenance.",
    systemPrompt:
      "You are Repair Request Template.\n" +
      "Write a concise repair request including: issue, impact, dates, and a reasonable response timeline.\n" +
      "Output only the message.",
  },
  {
    tool: "neighbor-boundary-note",
    category: "neighbors-living",
    emoji: "📝",
    title: "Neighbor Boundary Note",
    description: "Set boundaries with a neighbor politely but firmly.",
    actionLabel: "Write Note",
    fields: [TEXT_FIELD("Boundary issue, examples, and how direct you want to be...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_NEIGHBOR_BOUNDARY_NOTE",
    scopeHint: "Write a boundary-setting note to a neighbor.",
    systemPrompt:
      "You are Neighbor Boundary Note.\n" +
      "Write a polite, firm note: describe behavior, request change, offer compromise, close kindly.\n" +
      "Output only the note.",
  },

  // Creators & Media (more)
  {
    tool: "youtube-script-starter",
    category: "creators-media",
    emoji: "📺",
    title: "YouTube Script Starter",
    description: "Turn a topic into a tight intro + outline + CTA structure.",
    actionLabel: "Start Script",
    fields: [TEXT_FIELD("Topic, audience level, and desired length...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_YOUTUBE_SCRIPT_STARTER",
    scopeHint: "Create a YouTube script outline and intro.",
    systemPrompt:
      "You are YouTube Script Starter.\n" +
      "Output: hook, intro, 5-section outline, and CTA. Keep it punchy.\n" +
      "Output only the script starter.",
  },
  {
    tool: "brand-voice-codifier",
    category: "creators-media",
    emoji: "🎨",
    title: "Brand Voice Codifier",
    description: "Define your brand voice with rules and examples.",
    actionLabel: "Define Voice",
    fields: [TEXT_FIELD("Describe your brand, audience, competitors, and 3 example posts you like...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_BRAND_VOICE_CODIFIER",
    scopeHint: "Define a brand voice guide.",
    systemPrompt:
      "You are Brand Voice Codifier.\n" +
      "Create a voice guide: adjectives, do/don't, vocabulary, sentence style, emoji rules, and 3 example captions.\n" +
      "Output only the guide.",
  },
  {
    tool: "comment-reply-assistant",
    category: "creators-media",
    emoji: "💬",
    title: "Comment Reply Assistant",
    description: "Craft replies to comments that boost community and reduce conflict.",
    actionLabel: "Write Replies",
    fields: [TEXT_FIELD("Paste 5-20 comments and your preferred tone...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_COMMENT_REPLY_ASSISTANT",
    scopeHint: "Write replies to social media comments.",
    systemPrompt:
      "You are Comment Reply Assistant.\n" +
      "Write short replies for each comment. Be warm, concise, and de-escalate negativity.\n" +
      "Output only replies in the same order.",
  },

  // Family & Deep Personal (more)
  {
    tool: "supportive-checkin-texts",
    category: "family-deep-personal",
    emoji: "🫂",
    title: "Supportive Check‑in Texts",
    description: "Send kind check-ins that feel genuine, not performative.",
    actionLabel: "Write Check‑ins",
    fields: [TEXT_FIELD("Who you’re texting, what they’re going through, and your relationship...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_SUPPORTIVE_CHECKIN_TEXTS",
    scopeHint: "Write supportive personal check-in messages.",
    systemPrompt:
      "You are Supportive Check‑in Texts.\n" +
      "Write 5 short check-in messages: warm, non-intrusive, no toxic positivity.\n" +
      "Output only the messages.",
  },
  {
    tool: "family-therapy-invite",
    category: "family-deep-personal",
    emoji: "🕊️",
    title: "Family Therapy Invite",
    description: "Invite someone to counseling in a respectful, non-blaming way.",
    actionLabel: "Write Invite",
    fields: [TEXT_FIELD("Who, why, what you hope to improve, and their likely concerns...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FAMILY_THERAPY_INVITE",
    scopeHint: "Write a message inviting someone to therapy/counseling.",
    systemPrompt:
      "You are Family Therapy Invite.\n" +
      "Write a respectful invite: feelings, goals, reassurance, logistics, and an easy out.\n" +
      "Output only the message.",
  },

  // Work & Career (more)
  {
    tool: "promotion-case-builder",
    category: "work-career",
    emoji: "🏆",
    title: "Promotion Case Builder",
    description: "Build a crisp case for promotion with impact bullets and evidence.",
    actionLabel: "Build Case",
    fields: [TEXT_FIELD("Role, achievements, leadership examples, and target level...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PROMOTION_CASE_BUILDER",
    scopeHint: "Write a promotion case summary.",
    systemPrompt:
      "You are Promotion Case Builder.\n" +
      "Create a promotion case: summary, impact bullets with metrics, leadership examples, and ask.\n" +
      "Output only the case.",
  },
  {
    tool: "job-interview-story-bank",
    category: "work-career",
    emoji: "🎤",
    title: "Interview Story Bank",
    description: "Turn experiences into STAR stories ready for interviews.",
    actionLabel: "Create Stories",
    fields: [TEXT_FIELD("Paste experiences/achievements and the role you're applying for...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_JOB_INTERVIEW_STORY_BANK",
    scopeHint: "Generate STAR interview stories.",
    systemPrompt:
      "You are Interview Story Bank.\n" +
      "Create 6 STAR stories (Situation/Task/Action/Result) with strong outcomes and numbers.\n" +
      "Output only the stories.",
  },

  // Crisis & Money (more)
  {
    tool: "insurance-claim-letter",
    category: "crisis-money",
    emoji: "🧷",
    title: "Insurance Claim Letter",
    description: "Draft a clear claim letter with facts, dates, and requested coverage.",
    actionLabel: "Draft Claim",
    fields: [TEXT_FIELD("Insurer, policy details, incident timeline, damages, and requested outcome...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_INSURANCE_CLAIM_LETTER",
    scopeHint: "Write an insurance claim letter.",
    systemPrompt:
      "You are Insurance Claim Letter.\n" +
      "Write a factual claim letter: incident details, damages, evidence list, and requested resolution.\n" +
      "Output only the letter.",
  },

  // Social & Dating (more)
  {
    tool: "event-invite-texts",
    category: "social-dating",
    emoji: "🎉",
    title: "Event Invite Texts",
    description: "Invite people to an event with the right vibe (not awkward).",
    actionLabel: "Write Invites",
    fields: [TEXT_FIELD("Event details, audience, and tone (casual, classy, funny)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_EVENT_INVITE_TEXTS",
    scopeHint: "Write invitation messages for an event.",
    systemPrompt:
      "You are Event Invite Texts.\n" +
      "Write 5 invite messages: short, clear details, friendly CTA.\n" +
      "Output only the messages.",
  },

  // Freelance & Business (more)
  {
    tool: "upsell-suggester",
    category: "freelance-business",
    emoji: "⬆️",
    title: "Upsell Suggester",
    description: "Suggest tasteful upsells that feel helpful, not pushy.",
    actionLabel: "Suggest Upsells",
    fields: [TEXT_FIELD("What the client bought, goals, constraints, and what you can additionally offer...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_UPSELL_SUGGESTER",
    scopeHint: "Propose upsells for a client project.",
    systemPrompt:
      "You are Upsell Suggester.\n" +
      "Suggest 5 upsells with: benefit, effort, price range guidance, and how to pitch in one sentence.\n" +
      "Output only the upsells.",
  },
  {
    tool: "discovery-call-questions",
    category: "freelance-business",
    emoji: "❓",
    title: "Discovery Call Questions",
    description: "Generate sharp questions that uncover real needs and budget.",
    actionLabel: "Generate Questions",
    fields: [TEXT_FIELD("Client type, project idea, and what you already know...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DISCOVERY_CALL_QUESTIONS",
    scopeHint: "Prepare discovery call questions.",
    systemPrompt:
      "You are Discovery Call Questions.\n" +
      "Create 20 questions grouped by: goals, constraints, stakeholders, timeline, success metrics, budget, risks.\n" +
      "Output only the questions.",
  },
  {
    tool: "case-study-writer",
    category: "freelance-business",
    emoji: "📊",
    title: "Case Study Writer",
    description: "Turn project notes into a clean, credible case study.",
    actionLabel: "Write Case Study",
    fields: [TEXT_FIELD("Client, problem, approach, deliverables, and results/metrics...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CASE_STUDY_WRITER",
    scopeHint: "Write a project case study.",
    systemPrompt:
      "You are Case Study Writer.\n" +
      "Write: Background, Problem, Approach, Execution, Results (with metrics), and Lessons.\n" +
      "Output only the case study.",
  },

  // Academic & Bureaucracy (more)
  {
    tool: "resume-bullet-academia",
    category: "academic-bureaucracy",
    emoji: "📄",
    title: "Academic CV Bullet Builder",
    description: "Create impact-focused bullets for academic CVs and applications.",
    actionLabel: "Write Bullets",
    fields: [TEXT_FIELD("Role, responsibilities, publications/projects, and outcomes...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_RESUME_BULLET_ACADEMIA",
    scopeHint: "Write academic CV bullets.",
    systemPrompt:
      "You are Academic CV Bullet Builder.\n" +
      "Write 12 bullets with action verbs, specificity, and outcomes. Avoid fluff.\n" +
      "Output only the bullets.",
  },
  {
    tool: "official-request-letter",
    category: "academic-bureaucracy",
    emoji: "📮",
    title: "Official Request Letter",
    description: "Draft a polite, formal request to an institution or authority.",
    actionLabel: "Draft Request",
    fields: [TEXT_FIELD("Who you're writing to, what you request, relevant facts/dates, and urgency...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_OFFICIAL_REQUEST_LETTER",
    scopeHint: "Write a formal request letter.",
    systemPrompt:
      "You are Official Request Letter.\n" +
      "Write a formal letter with clear subject, facts, request, and contact details.\n" +
      "Output only the letter.",
  },

  // Neighbors & Living (more)
  {
    tool: "parking-dispute-note",
    category: "neighbors-living",
    emoji: "🚗",
    title: "Parking Dispute Note",
    description: "Resolve parking issues politely with a clear ask.",
    actionLabel: "Write Note",
    fields: [TEXT_FIELD("What happened, where, how often, and what you want to change...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PARKING_DISPUTE_NOTE",
    scopeHint: "Write a note about parking conflict.",
    systemPrompt:
      "You are Parking Dispute Note.\n" +
      "Write a calm, neighborly note with facts and a clear request.\n" +
      "Output only the note.",
  },

  // Creators & Media (more)
  {
    tool: "press-release-mini",
    category: "creators-media",
    emoji: "📰",
    title: "Press Release Mini",
    description: "Write a short press release announcing a launch or update.",
    actionLabel: "Write Release",
    fields: [TEXT_FIELD("What you're launching, who it's for, key benefits, and date...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PRESS_RELEASE_MINI",
    scopeHint: "Write a press release.",
    systemPrompt:
      "You are Press Release Mini.\n" +
      "Write a short press release with: headline, subheadline, body, and boilerplate.\n" +
      "Output only the press release.",
  },

  // Family & Deep Personal (more)
  {
    tool: "apology-repair-plan",
    category: "family-deep-personal",
    emoji: "🧷",
    title: "Apology + Repair Plan",
    description: "Apologize sincerely and propose a realistic repair plan.",
    actionLabel: "Write Apology",
    fields: [TEXT_FIELD("What happened, who was hurt, what you’re changing, and next steps...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_APOLOGY_REPAIR_PLAN",
    scopeHint: "Write an apology with a repair plan.",
    systemPrompt:
      "You are Apology + Repair Plan.\n" +
      "Write an apology that is accountable, specific, and includes a concrete repair plan.\n" +
      "Output only the message.",
  },

  // Work & Career (more)
  {
    tool: "meeting-agenda-generator",
    category: "work-career",
    emoji: "🧾",
    title: "Meeting Agenda Generator",
    description: "Create an agenda that keeps meetings short and productive.",
    actionLabel: "Create Agenda",
    fields: [TEXT_FIELD("Meeting purpose, attendees, topics, and desired outcomes...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_MEETING_AGENDA_GENERATOR",
    scopeHint: "Create a meeting agenda.",
    systemPrompt:
      "You are Meeting Agenda Generator.\n" +
      "Create a structured agenda: objectives, topics with timeboxes, decisions needed, and prep items.\n" +
      "Output only the agenda.",
  },

  // Crisis & Money (more)
  {
    tool: "dispute-mediator-email",
    category: "crisis-money",
    emoji: "🤝",
    title: "Dispute Mediator Email",
    description: "De-escalate conflicts and move toward a resolution calmly.",
    actionLabel: "Draft Mediation",
    fields: [TEXT_FIELD("What happened, parties involved, what you want, and what you can concede...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DISPUTE_MEDIATOR_EMAIL",
    scopeHint: "Write a de-escalating dispute email.",
    systemPrompt:
      "You are Dispute Mediator Email.\n" +
      "Write a calm email: facts, empathy, proposed resolution options, and next step.\n" +
      "Output only the email.",
  },

  // Social & Dating (more)
  {
    tool: "relationship-define-the-talk",
    category: "social-dating",
    emoji: "🧠",
    title: "Define‑The‑Relationship Talk",
    description: "Start 'what are we?' talks in a confident, low-pressure way.",
    actionLabel: "Draft Message",
    fields: [TEXT_FIELD("Context, what you want, what you fear, and how direct to be...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_RELATIONSHIP_DEFINE_THE_TALK",
    scopeHint: "Draft a message to define the relationship.",
    systemPrompt:
      "You are Define‑The‑Relationship Talk.\n" +
      "Write 3 options (soft, direct, very direct) to start the conversation without ultimatums.\n" +
      "Output only the 3 messages.",
  },

  // Fill to 100 tools (balanced set)
  {
    tool: "freelance-rate-card-maker",
    category: "freelance-business",
    emoji: "💳",
    title: "Rate Card Maker",
    description: "Create a clean rate card with packages, scope, and boundaries.",
    actionLabel: "Create Rate Card",
    fields: [TEXT_FIELD("Your services, typical deliverables, and pricing preferences...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FREELANCE_RATE_CARD_MAKER",
    scopeHint: "Create a freelance rate card.",
    systemPrompt:
      "You are Rate Card Maker.\n" +
      "Create 3 packages (starter/standard/premium) with deliverables, timeline, price ranges, and exclusions.\n" +
      "Output only the rate card.",
  },
  {
    tool: "client-red-flag-detector",
    category: "freelance-business",
    emoji: "🚩",
    title: "Client Red‑Flag Detector",
    description: "Spot risky client behaviors and craft safe responses.",
    actionLabel: "Detect Red Flags",
    fields: [TEXT_FIELD("Paste the client message / situation and your concerns...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CLIENT_RED_FLAG_DETECTOR",
    scopeHint: "Assess client risk and suggest a response.",
    systemPrompt:
      "You are Client Red‑Flag Detector.\n" +
      "Output: red flags (bullets), risk level (low/med/high), and a safe reply template.\n" +
      "Output only that.",
  },
  {
    tool: "invoice-line-item-writer",
    category: "freelance-business",
    emoji: "🧾",
    title: "Invoice Line‑Item Writer",
    description: "Turn deliverables into clear, professional invoice descriptions.",
    actionLabel: "Write Line Items",
    fields: [TEXT_FIELD("Deliverables list, hours, and any milestones...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_INVOICE_LINE_ITEM_WRITER",
    scopeHint: "Write invoice line items.",
    systemPrompt:
      "You are Invoice Line‑Item Writer.\n" +
      "Rewrite deliverables into clear invoice line items with short descriptors.\n" +
      "Output only the line items.",
  },

  {
    tool: "application-email-writer",
    category: "academic-bureaucracy",
    emoji: "📨",
    title: "Application Email Writer",
    description: "Send a clean application email with attachments and a clear ask.",
    actionLabel: "Draft Email",
    fields: [TEXT_FIELD("Role/program, attachments, brief pitch, and any deadlines...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_APPLICATION_EMAIL_WRITER",
    scopeHint: "Write an application email.",
    systemPrompt:
      "You are Application Email Writer.\n" +
      "Write a concise email: intro, fit, attachments list, and polite next step.\n" +
      "Output only the email.",
  },
  {
    tool: "policy-appeal-letter",
    category: "academic-bureaucracy",
    emoji: "📌",
    title: "Policy Appeal Letter",
    description: "Appeal a decision politely with facts and a reasonable request.",
    actionLabel: "Write Appeal",
    fields: [TEXT_FIELD("Decision, policy, your circumstances, evidence, and desired outcome...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_POLICY_APPEAL_LETTER",
    scopeHint: "Write a policy appeal letter.",
    systemPrompt:
      "You are Policy Appeal Letter.\n" +
      "Write a respectful appeal: facts, impact, evidence list, request, and gratitude.\n" +
      "Output only the letter.",
  },
  {
    tool: "meeting-request-formal",
    category: "academic-bureaucracy",
    emoji: "🗓️",
    title: "Formal Meeting Request",
    description: "Request a meeting with clear agenda and time options.",
    actionLabel: "Request Meeting",
    fields: [TEXT_FIELD("Who, why you need the meeting, urgency, and your availability...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_MEETING_REQUEST_FORMAL",
    scopeHint: "Write a formal meeting request email.",
    systemPrompt:
      "You are Formal Meeting Request.\n" +
      "Write a polite email with reason, agenda bullets, 3 time options, and a thank-you.\n" +
      "Output only the email.",
  },

  {
    tool: "neighbor-group-chat-reset",
    category: "neighbors-living",
    emoji: "📣",
    title: "Neighbor Group‑Chat Reset",
    description: "Reset a chaotic building/WhatsApp group with clear rules and tone.",
    actionLabel: "Reset Chat",
    fields: [TEXT_FIELD("What’s going wrong in the group and the rules you want...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_NEIGHBOR_GROUP_CHAT_RESET",
    scopeHint: "Write a group message to reset norms.",
    systemPrompt:
      "You are Neighbor Group‑Chat Reset.\n" +
      "Write a firm but friendly group message setting rules, channels, and expectations.\n" +
      "Output only the message.",
  },
  {
    tool: "package-theft-report",
    category: "neighbors-living",
    emoji: "📦",
    title: "Package Theft Report",
    description: "Report a missing package clearly to carrier/building/neighbor.",
    actionLabel: "Write Report",
    fields: [TEXT_FIELD("Tracking info, dates, location, and what you’ve tried...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PACKAGE_THEFT_REPORT",
    scopeHint: "Write a report about a missing package.",
    systemPrompt:
      "You are Package Theft Report.\n" +
      "Write a concise report email including: tracking, timeline, evidence, and requested action.\n" +
      "Output only the message.",
  },
  {
    tool: "maintenance-followup-escalation",
    category: "neighbors-living",
    emoji: "⚠️",
    title: "Maintenance Follow‑up Escalation",
    description: "Escalate ignored maintenance requests professionally.",
    actionLabel: "Escalate Request",
    fields: [TEXT_FIELD("Original request, dates, lack of response, impact, and what you need now...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_MAINTENANCE_FOLLOWUP_ESCALATION",
    scopeHint: "Escalate a maintenance request.",
    systemPrompt:
      "You are Maintenance Follow‑up Escalation.\n" +
      "Write a firm, factual follow-up with a clear deadline and next steps.\n" +
      "Output only the message.",
  },

  {
    tool: "collab-pitch-writer",
    category: "creators-media",
    emoji: "🤝",
    title: "Collab Pitch Writer",
    description: "Pitch collaborations that feel personal and win replies.",
    actionLabel: "Write Pitch",
    fields: [TEXT_FIELD("Creator/brand you're pitching, why it's a fit, and your idea...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_COLLAB_PITCH_WRITER",
    scopeHint: "Write a creator collaboration pitch message.",
    systemPrompt:
      "You are Collab Pitch Writer.\n" +
      "Write 3 pitches (short, medium, bold) with one clear ask and one specific compliment.\n" +
      "Output only the messages.",
  },
  {
    tool: "newsletter-intro-writer",
    category: "creators-media",
    emoji: "🗞️",
    title: "Newsletter Intro Writer",
    description: "Write newsletter intros that hook and set the tone.",
    actionLabel: "Write Intro",
    fields: [TEXT_FIELD("Newsletter topic, audience, and tone...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_NEWSLETTER_INTRO_WRITER",
    scopeHint: "Write a newsletter intro.",
    systemPrompt:
      "You are Newsletter Intro Writer.\n" +
      "Write 5 intro options (2-4 sentences) with different angles.\n" +
      "Output only the intros.",
  },
  {
    tool: "brand-crisis-reply",
    category: "creators-media",
    emoji: "🧯",
    title: "Brand Crisis Reply",
    description: "Draft a calm public response during backlash or controversy.",
    actionLabel: "Draft Response",
    fields: [TEXT_FIELD("What happened, what you can admit, what you can't, and desired outcome...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_BRAND_CRISIS_REPLY",
    scopeHint: "Write a public crisis response statement.",
    systemPrompt:
      "You are Brand Crisis Reply.\n" +
      "Write a short public statement: acknowledge, clarify facts, responsibility if needed, next steps.\n" +
      "Output only the statement.",
  },

  {
    tool: "grief-support-message",
    category: "family-deep-personal",
    emoji: "🕯️",
    title: "Grief Support Message",
    description: "Write a compassionate message for someone grieving.",
    actionLabel: "Write Message",
    fields: [TEXT_FIELD("Who, what happened (optional), your relationship, and what you want to convey...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_GRIEF_SUPPORT_MESSAGE",
    scopeHint: "Write a condolence/support message.",
    systemPrompt:
      "You are Grief Support Message.\n" +
      "Write 3 condolence messages: short, medium, and very short. No clichés, no toxic positivity.\n" +
      "Output only the messages.",
  },
  {
    tool: "family-boundary-reinforcer",
    category: "family-deep-personal",
    emoji: "🧱",
    title: "Family Boundary Reinforcer",
    description: "Reinforce boundaries when they get pushed—firm, calm, repeatable.",
    actionLabel: "Reinforce Boundary",
    fields: [TEXT_FIELD("Boundary, recent pushback, and how firm you want to be...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FAMILY_BOUNDARY_REINFORCER",
    scopeHint: "Reinforce boundaries with family.",
    systemPrompt:
      "You are Family Boundary Reinforcer.\n" +
      "Write 5 short boundary replies that repeat the boundary calmly and end the conversation.\n" +
      "Output only the replies.",
  },
  {
    tool: "relationship-repair-text",
    category: "family-deep-personal",
    emoji: "🧡",
    title: "Relationship Repair Text",
    description: "Send a repair message after conflict without reopening the fight.",
    actionLabel: "Write Repair Text",
    fields: [TEXT_FIELD("What happened, your part, what you want, and the tone...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_RELATIONSHIP_REPAIR_TEXT",
    scopeHint: "Write a repair message after conflict.",
    systemPrompt:
      "You are Relationship Repair Text.\n" +
      "Write a short message: accountability, empathy, request to reconnect, and a gentle close.\n" +
      "Output only the message.",
  },

  {
    tool: "work-status-update-writer",
    category: "work-career",
    emoji: "✅",
    title: "Status Update Writer",
    description: "Turn messy progress into a crisp status update (for Slack/email).",
    actionLabel: "Write Update",
    fields: [TEXT_FIELD("What you did, what's blocked, next steps, and stakeholders...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_WORK_STATUS_UPDATE_WRITER",
    scopeHint: "Write a status update message.",
    systemPrompt:
      "You are Status Update Writer.\n" +
      "Write a concise update with sections: Done, Next, Blockers, Needs.\n" +
      "Output only the update.",
  },
  {
    tool: "manager-1on1-prep",
    category: "work-career",
    emoji: "🧑‍💼",
    title: "1:1 Prep Builder",
    description: "Prep for a manager 1:1 with agenda, asks, and talking points.",
    actionLabel: "Prep 1:1",
    fields: [TEXT_FIELD("Context, what you want, recent wins, blockers, and concerns...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_MANAGER_1ON1_PREP",
    scopeHint: "Prepare an agenda for a 1:1 meeting.",
    systemPrompt:
      "You are 1:1 Prep Builder.\n" +
      "Create: agenda, top asks, risks, and 3 questions to ask your manager.\n" +
      "Output only the prep.",
  },

  {
    tool: "budget-cut-message",
    category: "crisis-money",
    emoji: "✂️",
    title: "Budget Cut Message",
    description: "Communicate budget cuts with empathy and clarity.",
    actionLabel: "Draft Message",
    fields: [TEXT_FIELD("Who you're messaging, what's changing, and any alternatives/support...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_BUDGET_CUT_MESSAGE",
    scopeHint: "Write a message announcing budget cuts.",
    systemPrompt:
      "You are Budget Cut Message.\n" +
      "Write a clear, empathetic message: what changes, why (brief), timeline, and support/next steps.\n" +
      "Output only the message.",
  },
  {
    tool: "debt-payment-plan-text",
    category: "crisis-money",
    emoji: "📉",
    title: "Debt Payment Plan Text",
    description: "Propose a realistic payment plan message without shame.",
    actionLabel: "Propose Plan",
    fields: [TEXT_FIELD("Amount owed, what you can pay, schedule, and context...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_DEBT_PAYMENT_PLAN_TEXT",
    scopeHint: "Write a payment plan proposal message.",
    systemPrompt:
      "You are Debt Payment Plan Text.\n" +
      "Write a respectful message proposing a payment plan with dates and amounts.\n" +
      "Output only the message.",
  },

  {
    tool: "wedding-guest-decline",
    category: "social-dating",
    emoji: "💌",
    title: "Wedding Guest Decline",
    description: "Decline a wedding invitation warmly and clearly.",
    actionLabel: "Decline Invite",
    fields: [TEXT_FIELD("Who invited you, your relationship, and your reason (optional)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_WEDDING_GUEST_DECLINE",
    scopeHint: "Decline a wedding invitation politely.",
    systemPrompt:
      "You are Wedding Guest Decline.\n" +
      "Write a warm decline with gratitude, clear decline, optional brief reason, and well wishes.\n" +
      "Output only the message.",
  },

  // Final 10 to reach 100
  {
    tool: "freelance-offer-recap",
    category: "freelance-business",
    emoji: "📨",
    title: "Offer Recap Email",
    description: "Recap an offer clearly after a call to lock next steps.",
    actionLabel: "Write Recap",
    fields: [TEXT_FIELD("What was agreed: scope, timeline, price, and next step...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FREELANCE_OFFER_RECAP",
    scopeHint: "Write a recap email after a sales/discovery call.",
    systemPrompt:
      "You are Offer Recap Email.\n" +
      "Write a concise recap: summary, scope bullets, timeline, price, assumptions, and clear CTA.\n" +
      "Output only the email.",
  },
  {
    tool: "grant-abstract-writer",
    category: "academic-bureaucracy",
    emoji: "🧬",
    title: "Grant Abstract Writer",
    description: "Turn your idea into a crisp abstract with problem, method, impact.",
    actionLabel: "Write Abstract",
    fields: [TEXT_FIELD("Research idea, target audience, method, novelty, and impact...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_GRANT_ABSTRACT_WRITER",
    scopeHint: "Write a grant abstract.",
    systemPrompt:
      "You are Grant Abstract Writer.\n" +
      "Write a 200-300 word abstract with: problem, approach, novelty, feasibility, impact.\n" +
      "Output only the abstract.",
  },
  {
    tool: "neighbor-apology-note",
    category: "neighbors-living",
    emoji: "🙏",
    title: "Neighbor Apology Note",
    description: "Apologize to a neighbor and prevent future friction.",
    actionLabel: "Write Apology",
    fields: [TEXT_FIELD("What happened, impact, and what you'll do differently...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_NEIGHBOR_APOLOGY_NOTE",
    scopeHint: "Write an apology note to a neighbor.",
    systemPrompt:
      "You are Neighbor Apology Note.\n" +
      "Write a short apology: accountability, empathy, and a concrete prevention step.\n" +
      "Output only the note.",
  },
  {
    tool: "podcast-guest-pitch",
    category: "creators-media",
    emoji: "🎙️",
    title: "Podcast Guest Pitch",
    description: "Pitch yourself as a guest with a tight angle and topics.",
    actionLabel: "Pitch Podcast",
    fields: [TEXT_FIELD("Podcast, your bio, your angle, and 3 topic ideas...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PODCAST_GUEST_PITCH",
    scopeHint: "Write a podcast guest pitch.",
    systemPrompt:
      "You are Podcast Guest Pitch.\n" +
      "Write a short pitch including: why you're a fit, 3 episode topic ideas, and a simple CTA.\n" +
      "Output only the pitch.",
  },
  {
    tool: "family-announcement-writer",
    category: "family-deep-personal",
    emoji: "🍼",
    title: "Family Announcement Writer",
    description: "Write a warm announcement for big news with the right tone.",
    actionLabel: "Write Announcement",
    fields: [TEXT_FIELD("What you're announcing, audience, and tone (funny, heartfelt, formal)...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FAMILY_ANNOUNCEMENT_WRITER",
    scopeHint: "Write a family announcement message.",
    systemPrompt:
      "You are Family Announcement Writer.\n" +
      "Write 3 versions (short, medium, cute). Keep it warm and respectful.\n" +
      "Output only the announcements.",
  },
  {
    tool: "work-escalation-email",
    category: "work-career",
    emoji: "🚦",
    title: "Work Escalation Email",
    description: "Escalate an issue without blaming—facts, impact, and options.",
    actionLabel: "Escalate Issue",
    fields: [TEXT_FIELD("Issue, timeline, impact, what you tried, and what you need...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_WORK_ESCALATION_EMAIL",
    scopeHint: "Write an escalation email for a workplace issue.",
    systemPrompt:
      "You are Work Escalation Email.\n" +
      "Write a factual escalation: context, impact, attempted fixes, options, and requested decision.\n" +
      "Output only the email.",
  },
  {
    tool: "refund-followup-sequence",
    category: "crisis-money",
    emoji: "🔁",
    title: "Refund Follow‑up Sequence",
    description: "Follow up for a refund in 3 escalating steps.",
    actionLabel: "Write Sequence",
    fields: [TEXT_FIELD("Company, order, dates, previous replies, and what you want...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_REFUND_FOLLOWUP_SEQUENCE",
    scopeHint: "Write a refund follow-up email sequence.",
    systemPrompt:
      "You are Refund Follow‑up Sequence.\n" +
      "Write 3 emails: gentle follow-up, firm follow-up with deadline, final notice.\n" +
      "Output only the 3 emails.",
  },
  {
    tool: "first-date-followup",
    category: "social-dating",
    emoji: "🌙",
    title: "First Date Follow‑up",
    description: "Send a confident follow-up after a first date.",
    actionLabel: "Write Follow‑up",
    fields: [TEXT_FIELD("How the date went, what you want next, and your tone...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_FIRST_DATE_FOLLOWUP",
    scopeHint: "Write a follow-up text after a first date.",
    systemPrompt:
      "You are First Date Follow‑up.\n" +
      "Write 3 texts (sweet, playful, direct) with a clear next step.\n" +
      "Output only the texts.",
  },
  {
    tool: "neighborly-favor-ask",
    category: "neighbors-living",
    emoji: "🤲",
    title: "Neighborly Favor Ask",
    description: "Ask a neighbor for a favor without awkwardness.",
    actionLabel: "Ask Favor",
    fields: [TEXT_FIELD("What you need, dates/times, and how close you are...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_NEIGHBORLY_FAVOR_ASK",
    scopeHint: "Ask a neighbor for a favor politely.",
    systemPrompt:
      "You are Neighborly Favor Ask.\n" +
      "Write 3 favor-ask messages: short, warm, and very polite.\n" +
      "Output only the messages.",
  },
  {
    tool: "creator-bio-writer",
    category: "creators-media",
    emoji: "🧷",
    title: "Creator Bio Writer",
    description: "Write a sharp bio for socials and media kits (credible, not cringe).",
    actionLabel: "Write Bio",
    fields: [TEXT_FIELD("Who you are, niche, proof points, and desired vibe...")],
    stripeEnvVar: "NEXT_PUBLIC_STRIPE_LINK_CREATOR_BIO_WRITER",
    scopeHint: "Write a creator bio.",
    systemPrompt:
      "You are Creator Bio Writer.\n" +
      "Write 5 bio options: short (<=80 chars), medium (<=150), and one premium/press style. Include one CTA line.\n" +
      "Output only the bios.",
  },

  // This file now reaches 100 tool seeds.
];

