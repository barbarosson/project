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
    label: "Work & Career",
    description: "Emails, DMs, resignations, boundaries, performance and pay.",
  },
  "crisis-money": {
    label: "Crisis & Money",
    description: "Refunds, disputes, deadlines, apologies, reputation replies.",
  },
  "social-dating": {
    label: "Social & Dating",
    description: "Ghosting, boundaries, conflict, hard truths, clean messaging.",
  },
  "freelance-business": {
    label: "Freelance & Business",
    description: "Proposals, scopes, follow-ups, pricing, clients, contracts-lite copy.",
  },
  "academic-bureaucracy": {
    label: "Academic & Bureaucracy",
    description: "Applications, forms, formal letters, summaries, polite requests.",
  },
  "neighbors-living": {
    label: "Neighbors & Living",
    description: "Building issues, noise, repairs, HOA, roommate coordination.",
  },
  "creators-media": {
    label: "Creators & Media",
    description: "Hooks, scripts, captions, press, collabs, community replies.",
  },
  "family-deep-personal": {
    label: "Family & Deep Personal",
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
  // ... remaining tools to reach 100 will be added next.
];

