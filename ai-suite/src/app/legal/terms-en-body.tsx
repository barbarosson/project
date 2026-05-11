/** English legal body (binding copy). Localized shell wraps this in `terms/page.tsx`. */
export function TermsEnBody() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
      <p>
        By using isendai, you agree to these Terms. If you do not agree, do not use the service.
      </p>

      <h2 className="text-base font-semibold text-white">Service</h2>
      <p>
        isendai provides AI-assisted text generation and rewriting tools. Outputs are generated
        automatically and may contain errors. You are responsible for reviewing and verifying any
        result before you use or send it.
      </p>

      <h2 className="text-base font-semibold text-white">User content and privacy</h2>
      <p>
        You retain rights to the text you submit. We process your text to generate results, and we
        may store your inputs and outputs so you can access your history and versions across
        devices. You should avoid submitting sensitive personal data unless necessary.
      </p>

      <h2 className="text-base font-semibold text-white">Payments</h2>
      <p>
        The service may be offered via one-time credit packs and subscriptions. Payments are
        processed by Stripe. We do not store your full payment card details. Fees may be
        non-refundable except where required by law.
      </p>

      <h2 className="text-base font-semibold text-white">Acceptable use</h2>
      <p>
        You may not use the service to produce illegal content, to harass or defame others, or to
        violate any applicable law. We may restrict access if we reasonably believe the service is
        being misused.
      </p>

      <h2 className="text-base font-semibold text-white">Disclaimer</h2>
      <p>
        The service is provided “as is” without warranties of any kind. We do not guarantee that
        outputs will be accurate, complete, or suitable for any particular purpose.
      </p>

      <h2 className="text-base font-semibold text-white">Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, isendai will not be liable for indirect, incidental,
        special, consequential, or punitive damages, or any loss of profits or revenues, arising
        from your use of the service.
      </p>

      <h2 className="text-base font-semibold text-white">Contact</h2>
      <p>
        Questions about these Terms can be sent via the site owner or support channel listed on
        your purchase receipt.
      </p>
    </section>
  );
}
