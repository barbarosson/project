/** German legal body for Privacy when locale is `de`. */
import { LegalSupportContact } from "@/components/legal/legal-support-contact";

export function PrivacyDeBody() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
      <p>
        isendai hilft dir, den von dir bereitgestellten Text zu transformieren (z. B. Nachrichten
        entwerfen, umschreiben oder Kommunikationsvorlagen erzeugen).
      </p>

      <h2 className="text-base font-semibold text-white">Was wir erheben</h2>
      <p>
        Wir erheben nur die für den Dienst erforderlichen Informationen, z. B. den von dir
        eingereichten Text und grundlegende technische Daten (Browsertyp, ungefährer Standort aus
        der IP, Zeitstempel) für Sicherheit und Leistungsüberwachung.
      </p>

      <h2 className="text-base font-semibold text-white">Nutzung und Speicherung deines Textes</h2>
      <p>
        Dein eingereichter Text wird <strong>nur während der Verarbeitung</strong> zur Erzeugung
        deines Ergebnisses verwendet. Wir können deinen Text und generierte Ausgaben auch speichern,
        damit du geräteübergreifend auf Verlauf, Versionen und Credits zugreifen kannst.
      </p>
      <p>
        Du kannst die Löschung gespeicherter Inhalte durch Kontolöschung oder Kontakt zum Support
        verlangen. Wir streben an, angeforderte Daten innerhalb eines angemessenen Zeitraums zu
        löschen, vorbehaltlich rechtlicher und betrieblicher Anforderungen.
      </p>

      <h2 className="text-base font-semibold text-white">Zahlungen</h2>
      <p>
        Zahlungen werden von Lemon Squeezy abgewickelt. Wir speichern keine vollständigen
        Kartendaten. Lemon Squeezy kann Zahlungsinformationen gemäß seinen Richtlinien erheben und
        verarbeiten.
      </p>

      <h2 className="text-base font-semibold text-white">Drittanbieter-Auftragsverarbeiter</h2>
      <p>
        Zur Ergebniserstellung können wir deinen Eingabetext ausschließlich zur Verarbeitung an
        KI-Anbieter (z. B. OpenAI, Anthropic, Groq, DeepSeek oder Google) übermitteln. Diese
        Anbieter handeln als Auftragsverarbeiter für die Generierungsanfrage.
      </p>

      <h2 className="text-base font-semibold text-white">Sicherheit</h2>
      <p>
        Wir setzen angemessene technische und organisatorische Maßnahmen ein, um den Dienst zu
        schützen und das Risiko unbefugten Zugriffs oder Missbrauchs zu verringern.
      </p>

      <h2 className="text-base font-semibold text-white">Kontakt</h2>
      <p>
        Bei Fragen zu dieser Richtlinie erreichst du uns über den Seitenbetreiber oder den auf
        deinem Kaufbeleg genannten Support-Kanal.
      </p>
    </section>
  );
}
