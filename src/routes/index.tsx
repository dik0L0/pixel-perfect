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

const TICKER = ["Suivez votre argent", "100 % en FCFA", "Pensé pour le Gabon", "Zéro code PIN demandé", "Prévisions jusqu'à la paie"];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* ——— Hero éditorial ——— */}
      <section className="relative overflow-hidden dot-grid">
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:pt-20">
          <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />Pensé pour le Gabon · 100 % en FCFA
              </span>
              <h1 className="mt-6 font-display text-[13vw] font-extrabold leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]">
                Suivez<br />votre <span className="text-primary">argent.</span>
              </h1>
              <p className="mt-6 max-w-md text-lg text-muted-foreground">
                DOLA vous aide à comprendre vos dépenses, anticiper vos besoins et garder le contrôle de votre budget jusqu'à la prochaine paie <Rocket className="inline h-5 w-5 text-primary" />
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild variant="hero" size="lg" className="h-13 rounded-full px-7 text-base">
                  <Link to="/suivre-mon-argent">Suivre mon argent<ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />Aucun code PIN demandé
                </span>
              </div>
            </div>

            <div className="relative animate-rise [animation-delay:150ms]">
              <div className="absolute -inset-4 -z-10 rounded-t-full bg-gradient-primary opacity-15 blur-2xl" />
              <img
                src={heroImg}
                alt="Une utilisatrice suit son budget sur son téléphone à Libreville"
                width={1024}
                height={1152}
                className="mx-auto aspect-[4/5] w-full max-w-sm rounded-t-[10rem] rounded-b-[2rem] border-4 border-card object-cover shadow-soft"
              />
              <div className="absolute -bottom-6 -left-2 w-60 sm:-left-8 sm:w-72"><DashboardPreview /></div>
              <div className="absolute -right-1 top-10 rounded-2xl bg-night px-4 py-3 text-night-foreground shadow-soft sm:-right-4">
                <p className="text-[11px] uppercase tracking-widest opacity-60">Reste ce mois</p>
                <p className="font-display text-xl font-bold text-primary-glow">+ 87 500 <span className="text-xs font-medium">FCFA</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* ——— Bandeau défilant ——— */}
        <div className="border-y border-primary/15 bg-primary/5 py-3">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-4">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-10 text-sm font-semibold uppercase tracking-widest text-primary">
                {t}<span className="text-primary/40">●</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Pourquoi DOLA : bleu nuit, grands chiffres ——— */}
      <section className="bg-gradient-night text-night-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-glow">Pourquoi DOLA</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">
            Un carnet de dépenses ne suffit plus. <span className="text-primary-glow">DOLA est votre copilote.</span>
          </h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar-border sm:grid-cols-3">
            {[
              ["01", "3 scénarios", "de prévision du solde jusqu'à la prochaine paie : optimiste, réaliste, prudent."],
              ["02", "8 types", "d'alertes automatiques avant que le budget ne dérape."],
              ["03", "0 FCFA", "pour commencer. Vos chiffres restent les vôtres."],
            ].map(([n, a, b]) => (
              <div key={n} className="group bg-night/40 p-8 transition-colors hover:bg-sidebar-accent/50">
                <p className="font-display text-sm font-bold text-primary-glow">{n}</p>
                <p className="mt-6 font-display text-5xl font-extrabold tracking-tight">{a}</p>
                <p className="mt-3 text-sm leading-relaxed opacity-70">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProjectTeaser />

      {/* ——— FAQ ——— */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-primary">On vous répond</p>
        <h2 className="mt-3 text-center font-display text-3xl font-bold sm:text-4xl">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-10">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left text-base font-semibold">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-night p-8 text-night-foreground shadow-soft sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground">
                <Target className="h-3.5 w-3.5" />Suivi de projet
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Un projet en tête ?</h2>
              <p className="mt-3 opacity-75">Machine à laver, voyage, rentrée scolaire… Fixez votre objectif et voyez combien il faut, combien il manque et quand vous l'atteindrez.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Fermer" : "Créer un projet"}
              className={`grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform duration-300 hover:scale-105 ${open ? "rotate-45" : ""}`}
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
