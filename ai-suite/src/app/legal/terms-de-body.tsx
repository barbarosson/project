/** German legal body for Terms when locale is `de`. */
import { LegalSupportContact } from "@/components/legal/legal-support-contact";

export function TermsDeBody() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
      <p>
        Mit der Nutzung von isendai akzeptierst du diese Bedingungen. Wenn du nicht einverstanden
        bist, nutze den Dienst nicht.
      </p>

      <h2 className="text-base font-semibold text-white">Dienst</h2>
      <p>
        isendai bietet KI-gestützte Tools zur Texterstellung und -überarbeitung. Ausgaben werden
        automatisch erzeugt und können Fehler enthalten. Du bist dafür verantwortlich, jedes Ergebnis
        zu prüfen und zu verifizieren, bevor du es verwendest oder versendest.
      </p>

      <h2 className="text-base font-semibold text-white">Nutzerinhalte und Datenschutz</h2>
      <p>
        Du behältst die Rechte an dem von dir eingereichten Text. Wir verarbeiten deinen Text zur
        Ergebniserstellung und können Eingaben und Ausgaben speichern, damit du auf Verlauf und
        Versionen geräteübergreifend zugreifen kannst. Reiche keine sensiblen personenbezogenen Daten
        ein, sofern nicht erforderlich.
      </p>

      <h2 className="text-base font-semibold text-white">Zahlungen</h2>
      <p>
        Der Dienst kann über einmalige Credit-Pakete und Abonnements angeboten werden. Zahlungen
        werden von Lemon Squeezy (Merchant of Record) abgewickelt. Wir speichern keine vollständigen
        Kartendaten. Gebühren sind ggf. nicht erstattungsfähig, außer wenn das Gesetz es verlangt.
      </p>

      <h2 className="text-base font-semibold text-white">Zulässige Nutzung</h2>
      <p>
        Du darfst den Dienst nicht nutzen, um illegale Inhalte zu erzeugen, andere zu belästigen oder
        zu diffamieren oder geltendes Recht zu verletzen. Wir können den Zugang einschränken, wenn
        wir den begründeten Verdacht haben, dass der Dienst missbraucht wird.
      </p>

      <h2 className="text-base font-semibold text-white">Haftungsausschluss</h2>
      <p>
        Der Dienst wird „wie besehen“ ohne jegliche Gewährleistung bereitgestellt. Wir garantieren
        nicht, dass Ausgaben korrekt, vollständig oder für einen bestimmten Zweck geeignet sind.
      </p>

      <h2 className="text-base font-semibold text-white">Haftungsbeschränkung</h2>
      <p>
        Im gesetzlich zulässigen Umfang haftet isendai nicht für indirekte, zufällige, besondere,
        Folge- oder Strafschäden oder entgangenen Gewinn oder Einnahmen aus deiner Nutzung des
        Dienstes.
      </p>

      <h2 className="text-base font-semibold text-white">Kontakt</h2>
      <LegalSupportContact />
    </section>
  );
}
