import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/fonctionnalites" className="hover:text-foreground">Fonctionnalités</Link>
          <Link to="/comment-ca-marche" className="hover:text-foreground">Comment ça marche</Link>
          <Link to="/tarifs" className="hover:text-foreground">Tarifs</Link>
          <Link to="/auth" search={{ mode: "login" }} className="hover:text-foreground">Connexion</Link>
        </nav>
        <Button asChild variant="hero" size="sm" className="h-9 px-4"><Link to="/auth" search={{ mode: "signup" }}>Commencer gratuitement</Link></Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-night text-night-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo light />
          <p className="mt-3 max-w-xs text-sm opacity-70">Suivez votre argent. Conçu à Libreville pour le Gabon et bientôt toute la zone CEMAC.</p>
        </div>
        <div className="space-y-2 text-sm opacity-80">
          <p className="font-semibold opacity-100">Produit</p>
          <Link to="/fonctionnalites" className="block">Fonctionnalités</Link>
          <Link to="/tarifs" className="block">Tarifs</Link>
          <Link to="/comment-ca-marche" className="block">Comment ça marche</Link>
        </div>
        <div className="space-y-2 text-sm opacity-80">
          <p className="font-semibold opacity-100">Sécurité</p>
          <p>Aucun code PIN demandé</p>
          <p>Données chiffrées</p>
          <p>Vos données vous appartiennent</p>
        </div>
      </div>
      <p className="border-t border-sidebar-border py-5 text-center text-xs opacity-50">© {new Date().getFullYear()} DOLA. Tous droits réservés.</p>
    </footer>
  );
}

export const PLANS = [
  { id: "gratuit", name: "Gratuit", price: 0, features: ["Gestion des revenus", "Gestion des dépenses", "Tableau de bord", "Statistiques simples", "Budgets mensuels"] },
  { id: "premium", name: "Premium", price: 1000, highlight: true, features: ["Tout le plan Gratuit", "Prévisions financières", "Alertes avancées", "Statistiques détaillées", "Objectifs d'épargne", "Simulations financières"] },
  { id: "premium_plus", name: "Premium+", price: 2000, features: ["Toutes les fonctionnalités Premium", "Assistant financier IA", "Analyses avancées", "Recommandations personnalisées"] },
];

export function PricingCards({ current, onPick }: { current?: string; onPick?: (id: string) => void }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {PLANS.map((p) => (
        <div key={p.id} className={cn("card-surface relative flex flex-col p-6", p.highlight && "border-primary ring-2 ring-primary/20")}>
          {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Populaire</span>}
          <h3 className="text-lg font-semibold">{p.name}</h3>
          <p className="mt-2"><span className="font-display text-3xl font-bold">{p.price.toLocaleString("fr-FR")}</span> <span className="text-sm text-muted-foreground">FCFA / mois</span></p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm">
            {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{f}</li>)}
          </ul>
          {onPick ? (
            <Button variant={current === p.id ? "secondary" : p.highlight ? "hero" : "outline"} className="mt-6 rounded-xl" disabled={current === p.id} onClick={() => onPick(p.id)}>
              {current === p.id ? "Offre actuelle" : "Choisir"}
            </Button>
          ) : (
            <Button asChild variant={p.highlight ? "hero" : "outline"} className="mt-6 rounded-xl"><Link to="/auth" search={{ mode: "signup" }}>Commencer</Link></Button>
          )}
        </div>
      ))}
    </div>
  );
}
