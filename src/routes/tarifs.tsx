import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader, PricingCards } from "@/components/marketing";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — MONÉO" },
      { name: "description", content: "Gratuit, Premium à 1 000 FCFA/mois ou Premium+ à 2 000 FCFA/mois avec assistant IA." },
      { property: "og:title", content: "Tarifs MONÉO" },
      { property: "og:description", content: "Des offres accessibles en Franc CFA." },
    ],
  }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="text-center text-4xl font-bold">Choisissez votre offre</h1>
        <p className="mt-3 text-center text-muted-foreground">Paiement par Airtel Money et Moov Money bientôt disponible.</p>
        <div className="mt-12"><PricingCards /></div>
      </div>
      <SiteFooter />
    </div>
  ),
});
