import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/comment-ca-marche")({
  head: () => ({
    meta: [
      { title: "Comment ça marche — DOLA" },
      { name: "description", content: "Créez votre compte, configurez vos revenus et charges, puis laissez DOLA vous guider." },
      { property: "og:title", content: "Comment fonctionne DOLA" },
      { property: "og:description", content: "4 étapes pour reprendre le contrôle de votre budget." },
    ],
  }),
  component: Page,
});

const STEPS = [
  ["Créez votre compte", "Email ou Google, en moins d'une minute."],
  ["Décrivez votre situation", "Salaire, date de paie, loyer, électricité, scolarité… L'onboarding prend 3 minutes."],
  ["Recevez votre budget", "DOLA génère automatiquement un premier budget prévisionnel adapté."],
  ["Suivez et anticipez", "Enregistrez vos dépenses, recevez des alertes et consultez vos prévisions."],
];

function Page() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-center text-4xl font-bold">Comment ça marche</h1>
        <ol className="mt-12 space-y-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card-surface flex gap-5 p-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary font-display font-bold text-primary-foreground">{i + 1}</span>
              <div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
            </li>
          ))}
        </ol>
        <div className="mt-10 text-center"><Button asChild variant="hero" size="lg" className="h-12"><Link to="/auth" search={{ mode: "signup" }}>Créer mon compte</Link></Button></div>
      </div>
    </div>
  );
}
