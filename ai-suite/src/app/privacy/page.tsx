import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | isendai",
  description:
    "Privacy Policy for isendai. We process your text only to generate your result and do not store it after completion.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-pretty text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-sm text-slate-300">
        Effective date: {new Date().getFullYear()}-01-01
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
        <p>
          isendai helps you transform text you provide (for example, drafting messages, rewriting, or
          generating communication templates).
        </p>

        <h2 className="text-base font-semibold text-white">What we collect</h2>
        <p>
          We only collect the information needed to provide the service, such as the text you submit
          and basic technical data (e.g., browser type, approximate location derived from IP, and
          timestamps) for security and performance monitoring.
        </p>

        <h2 className="text-base font-semibold text-white">How we use your text (no storage)</h2>
        <p>
          The text you submit is used <strong>only during processing</strong> to generate your
          result. We do <strong>not</strong> intentionally store your submitted text after your
          result is returned. We also clear client-side saved inputs as soon as a result is produced
          or copied.
        </p>

        <h2 className="text-base font-semibold text-white">Payments</h2>
        <p>
          Payments are handled by Stripe. We do not store your full payment card details. Stripe may
          collect and process payment information according to their policies.
        </p>

        <h2 className="text-base font-semibold text-white">Third-party processors</h2>
        <p>
          To generate outputs, we may send your input text to AI providers (such as OpenAI,
          Anthropic, Groq, or DeepSeek) strictly for processing. These providers act as service
          processors for the generation request.
        </p>

        <h2 className="text-base font-semibold text-white">Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect the service and reduce
          the risk of unauthorized access or misuse.
        </p>

        <h2 className="text-base font-semibold text-white">Contact</h2>
        <p>
          If you have questions about this policy, please contact us via the site owner or support
          channel listed on your purchase receipt.
        </p>
      </section>
    </main>
  );
}

