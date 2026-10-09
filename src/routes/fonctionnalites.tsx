import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, BarChart3, Bell, Bot, Calculator, PieChart, Target, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/marketing";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/fonctionnalites")({
  head: () => ({
    meta: [
      { title: "Fonctionnalités — DOLA" },
      { name: "description", content: "Transactions, budgets, statistiques, prévisions, simulations, objectifs, alertes et assistant IA." },
      { property: "og:title", content: "Fonctionnalités DOLA" },
      { property: "og:description", content: "Tout ce qu'il faut pour piloter votre argent en FCFA." },
    ],
  }),
  component: Page,
});

const F = [
  [ArrowLeftRight, "Transactions", "Revenus et dépenses, moyens de paiement locaux, catégories personnalisées et import CSV."],
  [PieChart, "Budgets", "Un budget par catégorie, barres de progression et copie du mois précédent."],
  [BarChart3, "Statistiques", "Analyses mensuelles, trimestrielles et annuelles, taux d'épargne et de consommation."],
  [TrendingUp, "Prévisions", "Solde de fin de mois, date d'épuisement du budget et capacité d'épargne."],
  [Calculator, "Simulations", "« Puis-je acheter un téléphone à 150 000 FCFA ? » — réponse claire et date conseillée."],
  [Target, "Objectifs", "Montant restant, épargne mensuelle nécessaire et date estimée d'atteinte."],
  [Bell, "Alertes", "Seuils configurables, dépenses inhabituelles et résumés automatiques."],
  [Bot, "Assistant", "Un assistant qui explique vos chiffres, sans jamais inventer de montants."],
] as const;

function Page() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="text-center text-4xl font-bold">Un copilote financier complet</h1>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {F.map(([Icon, t, d]) => (
            <div key={t} className="card-surface p-6"><Icon className="h-6 w-6 text-primary" /><h3 className="mt-4 font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></div>
          ))}
        </div>
        <div className="mt-12 text-center"><Button asChild variant="hero" size="lg" className="h-12"><Link to="/auth" search={{ mode: "signup" }}>Commencer gratuitement</Link></Button></div>
      </div>
    </div>
  );
}
