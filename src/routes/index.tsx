import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Plus, Rocket, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/marketing";
import { DashboardPreview } from "@/components/DashboardPreview";
import heroImg from "@/assets/hero-dola.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DOLA — Suivez votre argent." },
      { name: "description", content: "Suivez vos dépenses en FCFA, anticipez vos fins de mois et atteignez vos objectifs avec votre assistant budgétaire intelligent." },
      { property: "og:title", content: "DOLA — Votre copilote financier au Gabon" },
      { property: "og:description", content: "Budgets, prévisions, alertes et épargne en Franc CFA." },
    ],
  }),
  component: Index,
});

const FAQ: [string, string][] = [
  ["DOLA est-il gratuit ?", "Oui, l'offre Gratuite couvre revenus, dépenses, tableau de bord et budgets. Les offres Premium ajoutent prévisions, simulations et assistant IA."],
  ["Mes données sont-elles en sécurité ?", "Vos données sont chiffrées et accessibles uniquement par vous. Nous ne les revendons jamais."],
  ["Faut-il connecter mon compte Mobile Money ?", "Non. Vous saisissez ou importez vos opérations. DOLA ne vous demandera jamais votre code PIN ni votre mot de passe bancaire."],
  ["Les prévisions sont-elles fiables ?", "Ce sont des estimations basées sur votre historique. Les hypothèses utilisées sont toujours affichées."],
  ["Puis-je l'utiliser sur mon téléphone ?", "Oui, DOLA est conçu d'abord pour le mobile et fonctionne dans votre navigateur."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" />Pensé pour le Gabon · 100 % en FCFA</span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">Suivez votre argent. <span className="text-primary">Simplement.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">DOLA vous aide à comprendre vos dépenses, anticiper vos besoins et garder le contrôle de votre budget jusqu'à la prochaine paie <Rocket className="inline h-5 w-5 text-primary" /></p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg" className="h-12 px-6"><Link to="/suivre-mon-argent">Suivre mon argent</Link></Button>
            </div>
            <div className="mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" />Aucun code PIN demandé</span>
            </div>
          </div>
          <div className="relative animate-rise [animation-delay:150ms]">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-primary opacity-20 blur-3xl" />
            <img src={heroImg} alt="Une utilisatrice suit son budget sur son téléphone à Libreville" width={1024} height={1152} className="aspect-[4/5] w-full max-w-md rounded-[2rem] object-cover shadow-soft sm:ml-auto" />
            <div className="absolute -bottom-8 -left-2 w-64 sm:left-0 sm:w-72"><DashboardPreview /></div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-night text-night-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Pourquoi utiliser DOLA ?</h2>
          <p className="mx-auto mt-4 max-w-2xl opacity-75">Parce qu'un simple carnet de dépenses ne suffit pas. DOLA agit comme un copilote : il analyse, prévoit et vous conseille pour prendre de meilleures décisions.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[["3 scénarios", "de prévision du solde"], ["8 types", "d'alertes automatiques"], ["0 FCFA", "pour commencer"]].map(([a, b]) => (
              <div key={a} className="rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-6"><p className="font-display text-3xl font-bold">{a}</p><p className="mt-1 text-sm opacity-70">{b}</p></div>
            ))}
          </div>
        </div>
      </section>

      <ProjectTeaser />

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}

function ProjectTeaser() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const ready = name.trim().length > 0 && Number(budget) > 0;

  return (
    <section className="mx-auto max-w-4xl px-4 pt-20 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-night p-8 text-night-foreground shadow-soft sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground"><Target className="h-3.5 w-3.5" />Suivi de projet</span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Un projet en tête ?</h2>
              <p className="mt-3 opacity-75">Machine à laver, voyage, rentrée scolaire… Fixez votre objectif et voyez combien il faut, combien il manque et quand vous l'atteindrez.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Fermer" : "Créer un projet"}
              className={`grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant transition-transform duration-300 hover:scale-105 ${open ? "rotate-45" : ""}`}
            >
              <Plus className="h-8 w-8" />
            </button>
          </div>

          <div className={`grid transition-all duration-500 ${open ? "mt-8 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="grid gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4 backdrop-blur sm:grid-cols-[1fr_1fr_auto] sm:p-5">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'objectif (ex. Voyage à São Tomé)" className="h-12 border-sidebar-border bg-background/90 text-foreground" />
                <Input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} placeholder="Budget prévu (FCFA)" className="h-12 border-sidebar-border bg-background/90 text-foreground" />
                <Button asChild variant="hero" size="lg" className="h-12 px-6" disabled={!ready}>
                  <Link to="/mes-projets" search={{ name: name.trim() || undefined, budget: budget || undefined }}>
                    Lancer mon projet<ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
