import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, TrendingUp, Wallet, PiggyBank, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fcfa } from "@/lib/finance";

export const Route = createFileRoute("/suivre-mon-argent")({
  // Petit chargement volontaire pour que le loader circulaire apparaisse.
  loader: () => new Promise((r) => setTimeout(r, 500)),
  head: () => ({
    meta: [
      { title: "Suivre mon argent — DOLA" },
      { name: "description", content: "Entrez vos revenus et toutes vos dépenses (loyer, internet, Netflix…) et voyez instantanément ce qu'il vous reste en FCFA." },
      { property: "og:title", content: "Suivre mon argent — DOLA" },
      { property: "og:description", content: "Simulez votre budget mensuel en FCFA : revenus, dépenses, reste à vivre et épargne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuivrePage,
});

interface Line { id: string; name: string; amount: number }
interface Group { key: string; label: string; emoji: string; items: Line[] }
interface State { incomes: Line[]; groups: Group[]; goal: number }

const uid = () => Math.random().toString(36).slice(2, 9);
const L = (name: string): Line => ({ id: uid(), name, amount: 0 });

const DEFAULT: () => State = () => ({
  incomes: [L("Salaire"), L("Revenu secondaire")],
  goal: 0,
  groups: [
    { key: "logement", label: "Logement", emoji: "🏠", items: [L("Loyer"), L("Électricité (SEEG)"), L("Eau (SEEG)"), L("Gaz")] },
    { key: "communication", label: "Communication", emoji: "📶", items: [L("Internet"), L("Forfait téléphone"), L("Crédit Airtel / Moov")] },
    { key: "abonnements", label: "Abonnements", emoji: "📺", items: [L("Netflix"), L("Canal+"), L("Spotify")] },
    { key: "alimentation", label: "Alimentation", emoji: "🛒", items: [L("Courses / marché"), L("Restaurant / maquis")] },
    { key: "transport", label: "Transport", emoji: "🚕", items: [L("Taxi / clando"), L("Carburant")] },
    { key: "famille", label: "Famille", emoji: "👨‍👩‍👧", items: [L("Scolarité"), L("Aide à la famille"), L("Tontine")] },
    { key: "sante", label: "Santé", emoji: "💊", items: [L("Pharmacie"), L("Assurance")] },
    { key: "loisirs", label: "Loisirs & shopping", emoji: "🎉", items: [L("Sorties"), L("Vêtements")] },
    { key: "autres", label: "Autres", emoji: "📦", items: [L("Divers")] },
  ],
});

const KEY = "dola-suivi-v1";

function AmountInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="relative w-36 shrink-0">
      <Input inputMode="numeric" value={value ? new Intl.NumberFormat("fr-FR").format(value) : ""} placeholder="0"
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
        className="h-11 rounded-xl pr-14 text-right font-semibold" />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">FCFA</span>
    </div>
  );
}

function Rows({ items, onChange, addLabel }: { items: Line[]; onChange: (l: Line[]) => void; addLabel: string }) {
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2">
          <Input value={it.name} onChange={(e) => onChange(items.map((x) => (x.id === it.id ? { ...x, name: e.target.value } : x)))} className="h-11 rounded-xl" />
          <AmountInput value={it.amount} onChange={(n) => onChange(items.map((x) => (x.id === it.id ? { ...x, amount: n } : x)))} />
          <button aria-label="Supprimer" onClick={() => onChange(items.filter((x) => x.id !== it.id))} className="rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, L("")])} className="flex items-center gap-1 text-sm font-medium text-primary"><Plus className="h-4 w-4" />{addLabel}</button>
    </div>
  );
}

function SuivrePage() {
  const [s, setS] = useState<State>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS(JSON.parse(raw)); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(s)); }, [s, loaded]);

  const r = useMemo(() => {
    const income = s.incomes.reduce((a, b) => a + b.amount, 0);
    const groups = s.groups.map((g) => ({ ...g, total: g.items.reduce((a, b) => a + b.amount, 0) })).sort((a, b) => b.total - a.total);
    const expense = groups.reduce((a, g) => a + g.total, 0);
    const rest = income - expense;
    const rate = income > 0 ? (rest / income) * 100 : 0;
    const lines = s.groups.flatMap((g) => g.items).filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount);
    const advice: { tone: "ok" | "warn" | "bad"; text: string }[] = [];
    if (income === 0) advice.push({ tone: "warn", text: "Commencez par entrer vos revenus du mois." });
    else {
      if (rest < 0) advice.push({ tone: "bad", text: `Vous dépensez ${fcfa(-rest)} de plus que vous ne gagnez. Réduisez d'abord vos plus grosses dépenses.` });
      else if (rate < 10) advice.push({ tone: "warn", text: `Vous épargnez ${rate.toFixed(0)} % de vos revenus. Visez au moins 10 %, soit ${fcfa(income * 0.1)} par mois.` });
      else advice.push({ tone: "ok", text: `Bravo : vous mettez de côté ${rate.toFixed(0)} % de vos revenus.` });
      const log = groups.find((g) => g.key === "logement");
      if (log && log.total > income * 0.35) advice.push({ tone: "warn", text: `Le logement représente ${((log.total / income) * 100).toFixed(0)} % de vos revenus (repère conseillé : 35 % maximum).` });
      const ab = groups.find((g) => g.key === "abonnements");
      if (ab && ab.total > 0) advice.push({ tone: "ok", text: `Vos abonnements coûtent ${fcfa(ab.total)}/mois, soit ${fcfa(ab.total * 12)} par an. Gardez seulement ceux que vous utilisez.` });
      if (s.goal > 0) advice.push(rest > 0
        ? { tone: "ok", text: `À ce rythme, votre objectif de ${fcfa(s.goal)} serait atteint en environ ${Math.ceil(s.goal / rest)} mois (estimation si rien ne change).` }
        : { tone: "bad", text: "Impossible d'atteindre votre objectif tant que le reste du mois est négatif." });
    }
    return { income, expense, rest, rate, groups, lines, advice };
  }, [s]);

  const setGroup = (key: string, items: Line[]) => setS({ ...s, groups: s.groups.map((g) => (g.key === key ? { ...g, items } : g)) });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 pb-40 lg:pb-12">
        <h1 className="font-display text-3xl font-bold">Suivre mon argent</h1>
        <p className="mt-1 text-muted-foreground">Entrez tout ici : vos revenus et chacune de vos dépenses du mois. Les résultats se calculent en direct et restent enregistrés sur cet appareil.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="mb-3 text-lg font-semibold">💰 1. Mes revenus du mois</h2>
              <Rows items={s.incomes} onChange={(incomes) => setS({ ...s, incomes })} addLabel="Ajouter un revenu" />
            </section>

            <section className="rounded-2xl border bg-card p-5">
              <h2 className="mb-1 text-lg font-semibold">🧾 2. Toutes mes dépenses</h2>
              <p className="mb-4 text-sm text-muted-foreground">Laissez à 0 ce qui ne vous concerne pas. Renommez ou ajoutez des lignes librement.</p>
              <div className="space-y-5">
                {s.groups.map((g) => (
                  <div key={g.key} className="rounded-xl bg-muted/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">{g.emoji} {g.label}</h3>
                      <span className="text-sm font-medium text-muted-foreground">{fcfa(g.items.reduce((a, b) => a + b.amount, 0))}</span>
                    </div>
                    <Rows items={g.items} onChange={(items) => setGroup(g.key, items)} addLabel="Ajouter une dépense" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-5">
              <h2 className="mb-3 text-lg font-semibold">🎯 3. Mon objectif d'épargne (facultatif)</h2>
              <div className="flex items-center gap-2"><span className="flex-1 text-sm">Montant à atteindre</span><AmountInput value={s.goal} onChange={(goal) => setS({ ...s, goal })} /></div>
            </section>

            <Button variant="outline" className="rounded-xl" onClick={() => { if (confirm("Tout effacer ?")) setS(DEFAULT()); }}><RotateCcw className="mr-2 h-4 w-4" />Tout effacer</Button>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl bg-sidebar p-5 text-sidebar-foreground">
              <p className="text-sm opacity-80">Reste à la fin du mois</p>
              <p className={`font-display text-3xl font-bold ${r.rest < 0 ? "text-destructive" : ""}`}>{fcfa(r.rest)}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="flex items-center gap-1 opacity-80"><Wallet className="h-4 w-4" />Revenus</p><p className="font-semibold">{fcfa(r.income)}</p></div>
                <div><p className="flex items-center gap-1 opacity-80"><TrendingUp className="h-4 w-4" />Dépenses</p><p className="font-semibold">{fcfa(r.expense)}</p></div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-sm"><PiggyBank className="h-4 w-4" />Taux d'épargne : {r.income ? `${r.rate.toFixed(0)} %` : "—"}</p>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h3 className="mb-3 font-semibold">Où part mon argent</h3>
              {r.expense === 0 ? <p className="text-sm text-muted-foreground">Entrez vos dépenses pour voir la répartition.</p> : (
                <div className="space-y-3">
                  {r.groups.filter((g) => g.total > 0).map((g) => (
                    <div key={g.key}>
                      <div className="flex justify-between text-sm"><span>{g.emoji} {g.label}</span><span className="font-medium">{fcfa(g.total)}</span></div>
                      <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(g.total / r.expense) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
              {r.lines.length > 0 && (
                <div className="mt-4 border-t pt-3 text-sm">
                  <p className="mb-2 font-medium">Top 3 des dépenses</p>
                  {r.lines.slice(0, 3).map((l) => <div key={l.id} className="flex justify-between"><span>{l.name || "Sans nom"}</span><span>{fcfa(l.amount)}</span></div>)}
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h3 className="mb-3 font-semibold">Conseils DOLA</h3>
              <ul className="space-y-2 text-sm">
                {r.advice.map((a, i) => (
                  <li key={i} className={`flex gap-2 rounded-lg p-2 ${a.tone === "bad" ? "bg-destructive/10" : a.tone === "warn" ? "bg-warning/10" : "bg-primary/10"}`}>
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{a.text}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Estimations basées uniquement sur les montants que vous avez saisis.</p>
            </div>

            <Button asChild variant="hero" className="h-12 w-full"><Link to="/auth" search={{ mode: "signup" }}>Créer mon compte pour suivre chaque mois</Link></Button>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm">
          <div><p className="text-muted-foreground">Reste du mois</p><p className={`text-lg font-bold ${r.rest < 0 ? "text-destructive" : "text-primary"}`}>{fcfa(r.rest)}</p></div>
          <div className="text-right"><p>Revenus {fcfa(r.income)}</p><p>Dépenses {fcfa(r.expense)}</p></div>
        </div>
      </div>
    </div>
  );
}
