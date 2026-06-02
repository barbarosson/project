import { isToolName, type ToolName } from "@/components/ai-suite/tools";

export type SeoTemplate = {
  slug: string;
  title: string;
  description: string;
  toolId: ToolName;
  h1: string;
  paragraph: string;
};

export const SEO_TEMPLATES: SeoTemplate[] = [
  {
    slug: "how-to-write-resignation-letter-to-toxic-boss",
    title: "Write a Professional Resignation Letter to a Toxic Boss | isendai",
    description:
      "Use our AI tool to instantly draft an HR-safe, polite resignation letter even if you are angry.",
    toolId: "graceful-quitter",
    h1: "Quit Professionally, Keep Your Sanity",
    paragraph:
      "Don't burn bridges. Paste your angry thoughts below, and let our AI translate them into a perfect resignation letter.",
  },
  {
    slug: "how-to-politely-decline-meeting-without-sounding-rude",
    title: "How to Politely Decline a Meeting (Without Sounding Rude) | isendai",
    description:
      "Say no to calendar overload with a firm, professional decline that protects your time and relationships.",
    toolId: "guilt-free-no",
    h1: "Decline the Meeting — Keep the Relationship",
    paragraph:
      "Paste your rough excuse or blunt draft. We'll turn it into a clear, respectful no that managers actually accept.",
  },
  {
    slug: "how-to-ask-for-raise-email-template",
    title: "How to Ask for a Raise by Email (AI Template) | isendai",
    description:
      "Draft a confident, evidence-based raise request email that sounds professional—not desperate or confrontational.",
    toolId: "raise-negotiator",
    h1: "Ask for More — Without the Awkwardness",
    paragraph:
      "Share your wins, target number, and tone. Our AI shapes a negotiation-ready email your manager can take seriously.",
  },
  {
    slug: "how-to-follow-up-on-unpaid-invoice-politely",
    title: "Polite Unpaid Invoice Follow-Up Email | isendai",
    description:
      "Chase late payments without damaging client relationships. Get a firm, professional invoice reminder in seconds.",
    toolId: "invoice-chaser",
    h1: "Get Paid — Stay Professional",
    paragraph:
      "Drop in the invoice details and how frustrated you are. We'll output a chase email that escalates politely.",
  },
  {
    slug: "how-to-apologize-to-client-for-mistake-email",
    title: "How to Apologize to a Client for a Mistake (Email) | isendai",
    description:
      "Recover trust after a screw-up with a sincere, accountable apology that doesn't sound like legal boilerplate.",
    toolId: "perfect-apology",
    h1: "Own the Mistake — Win Back Trust",
    paragraph:
      "Paste what happened and how mad they are. We'll craft an apology that's accountable, specific, and repair-focused.",
  },
  {
    slug: "how-to-write-cover-letter-from-resume-fast",
    title: "Write a Cover Letter From Your Resume in Minutes | isendai",
    description:
      "Turn a job posting link and your resume into a tailored cover letter that sounds human—not generic AI fluff.",
    toolId: "coverletter-ai",
    h1: "One Cover Letter, Actually Tailored",
    paragraph:
      "Add the job URL and paste your resume. Our AI writes a focused letter that mirrors the role's language.",
  },
  {
    slug: "how-to-reply-to-passive-aggressive-email-at-work",
    title: "How to Reply to a Passive-Aggressive Email at Work | isendai",
    description:
      "Decode the subtext and respond with a calm, professional email that sets boundaries without starting a war.",
    toolId: "corporate-whisperer",
    h1: "Answer the Subtext — Stay Corporate-Cool",
    paragraph:
      "Paste their email (or your angry draft reply). We'll help you respond with clarity, boundaries, and zero HR incidents.",
  },
  {
    slug: "how-to-text-someone-who-ghosted-you",
    title: "What to Text Someone Who Ghosted You | isendai",
    description:
      "Re-open the conversation without sounding desperate. Get a light, confident follow-up you can actually send.",
    toolId: "ghosting-resurrector",
    h1: "Break the Silence — Without Cringe",
    paragraph:
      "Tell us the context and vibe you want. We'll draft a re-entry text that feels confident, not thirsty.",
  },
  {
    slug: "how-to-set-boundaries-with-friend-text-message",
    title: "How to Set Boundaries With a Friend (Text Templates) | isendai",
    description:
      "Say what you need without blowing up the friendship. AI drafts boundary-setting texts that are kind and clear.",
    toolId: "delicate-truth",
    h1: "Be Honest — Without the Drama",
    paragraph:
      "Paste the situation or your harsh draft. We'll translate it into a boundary message that's firm and compassionate.",
  },
  {
    slug: "how-to-negotiate-freelance-project-scope-creep",
    title: "How to Push Back on Freelance Scope Creep | isendai",
    description:
      "Protect your rate and timeline when clients add 'just one more thing.' Get a professional scope-clarification message.",
    toolId: "change-request-shield",
    h1: "Stop Free Work — Keep the Client",
    paragraph:
      "Describe the extra asks and your frustration. We'll write a scope message that resets expectations and preserves the relationship.",
  },
];

function assertValidTemplates(templates: SeoTemplate[]) {
  const slugs = new Set<string>();
  for (const row of templates) {
    if (!isToolName(row.toolId)) {
      throw new Error(`[seo-templates] Invalid toolId "${row.toolId}" on slug "${row.slug}"`);
    }
    if (slugs.has(row.slug)) {
      throw new Error(`[seo-templates] Duplicate slug "${row.slug}"`);
    }
    slugs.add(row.slug);
  }
}

assertValidTemplates(SEO_TEMPLATES);

export function getSeoTemplateBySlug(slug: string): SeoTemplate | undefined {
  return SEO_TEMPLATES.find((t) => t.slug === slug);
}

export function getAllSeoTemplateSlugs(): string[] {
  return SEO_TEMPLATES.map((t) => t.slug);
}
