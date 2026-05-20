/** English legal body (binding copy). Localized shell wraps this in `privacy/page.tsx`. */
import { LegalSupportContact } from "@/components/legal/legal-support-contact";

export function PrivacyEnBody() {
  return (
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

      <h2 className="text-base font-semibold text-white">How we use and store your text</h2>
      <p>
        The text you submit is used <strong>only during processing</strong> to generate your
        result. We may also store your submitted text and generated outputs so you can access your
        history, versions, and credits across devices.
      </p>
      <p>
        You can request deletion of your stored content by deleting your account or contacting
        support. We aim to delete requested data within a reasonable timeframe, subject to legal
        and operational requirements.
      </p>

      <h2 className="text-base font-semibold text-white">Payments</h2>
      <p>
        Payments are handled by Lemon Squeezy. We do not store your full payment card details. Lemon Squeezy may
        collect and process payment information according to their policies.
      </p>

      <h2 className="text-base font-semibold text-white">Third-party processors</h2>
      <p>
        To generate outputs, we may send your input text to AI providers (such as OpenAI,
        Anthropic, Groq, DeepSeek, or Google) strictly for processing. These providers act as
        service processors for the generation request.
      </p>

      <h2 className="text-base font-semibold text-white">Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect the service and reduce
        the risk of unauthorized access or misuse.
      </p>

      <h2 className="text-base font-semibold text-white">Contact</h2>
      <LegalSupportContact />
    </section>
  );
}
