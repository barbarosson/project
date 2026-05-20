/** French legal body for Terms when locale is `fr`. */
import { LegalSupportContact } from "@/components/legal/legal-support-contact";

export function TermsFrBody() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
      <p>
        En utilisant isendai, vous acceptez les présentes Conditions. Si vous n&apos;êtes pas
        d&apos;accord, n&apos;utilisez pas le service.
      </p>

      <h2 className="text-base font-semibold text-white">Service</h2>
      <p>
        isendai fournit des outils de génération et de réécriture de texte assistés par l&apos;IA.
        Les résultats sont générés automatiquement et peuvent contenir des erreurs. Vous êtes
        responsable de relire et vérifier tout résultat avant de l&apos;utiliser ou de l&apos;envoyer.
      </p>

      <h2 className="text-base font-semibold text-white">Contenu utilisateur et confidentialité</h2>
      <p>
        Vous conservez les droits sur le texte que vous soumettez. Nous traitons votre texte pour
        produire des résultats et pouvons stocker vos entrées et sorties afin que vous accédiez à
        votre historique et à vos versions sur plusieurs appareils. Évitez de soumettre des données
        personnelles sensibles sauf si nécessaire.
      </p>

      <h2 className="text-base font-semibold text-white">Paiements</h2>
      <p>
        Le service peut être proposé via des packs de crédits ponctuels et des abonnements. Les
        paiements sont traités par Lemon Squeezy (revendeur officiel). Nous ne stockons pas les
        données complètes de votre carte. Les frais peuvent être non remboursables sauf lorsque la
        loi l&apos;exige.
      </p>

      <h2 className="text-base font-semibold text-white">Usage acceptable</h2>
      <p>
        Vous ne pouvez pas utiliser le service pour produire du contenu illégal, harceler ou diffamer
        autrui, ou enfreindre la loi applicable. Nous pouvons restreindre l&apos;accès si nous
        estimons raisonnablement que le service est détourné.
      </p>

      <h2 className="text-base font-semibold text-white">Avertissement</h2>
      <p>
        Le service est fourni « en l&apos;état », sans garantie d&apos;aucune sorte. Nous ne
        garantissons pas que les résultats seront exacts, complets ou adaptés à un usage particulier.
      </p>

      <h2 className="text-base font-semibold text-white">Limitation de responsabilité</h2>
      <p>
        Dans la mesure maximale permise par la loi, isendai ne sera pas responsable des dommages
        indirects, accessoires, spéciaux, consécutifs ou punitifs, ni de toute perte de profits ou de
        revenus liée à votre utilisation du service.
      </p>

      <h2 className="text-base font-semibold text-white">Contact</h2>
      <LegalSupportContact />
    </section>
  );
}
