import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Target, CalendarClock, CheckCircle2, AlertTriangle, Minus } from "lucide-react";
import { SiteHeader } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fcfa } from "@/lib/finance";

export const Route = createFileRoute("/mes-projets")({
  head: () => ({
    meta: [
      { title: "Suivi de projets — DOLA" },
      { name: "description", content: "Machine à laver, voyage, terrain : calculez combien il faut, combien il manque et votre progression en FCFA." },
      { property: "og:title", content: "Suivi de projets — DOLA" },
      { property: "og:description", content: "Simulez et suivez vos projets d'achat ou d'épargne en FCFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    name: typeof s.name === "string" ? s.name : undefined,
    budget: typeof s.budget === "string" ? s.budget : undefined,
  }),
  component: ProjectsPage,
});

type Deposit = { id: string; amount: number; date: string };
type Project = { id: string; name: string; emoji: string; target: number; deadline: string; monthly: number; deposits: Deposit[] };

const KEY = "dola-projets-v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const IDEAS = [
  { name: "Machine à laver", emoji: "🧺", target: 350000 },
  { name: "Voyage", emoji: "✈️", target: 800000 },
  { name: "Rentrée scolaire", emoji: "🎒", target: 250000 },
  { name: "Téléphone", emoji: "📱", target: 200000 },
  { name: "Fonds d'urgence", emoji: "🛟", target: 500000 },
];

function monthsBetween(from: Date, to: Date) {
  return Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + (to.getDate() >= from.getDate() ? 0 : -1));
}
function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }
const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

function stats(p: Project) {
  const saved = p.deposits.reduce((s, d) => s + d.amount, 0);
  const missing = Math.max(0, p.target - saved);
  const pct = p.target > 0 ? Math.min(100, (saved / p.target) * 100) : 0;
  const now = new Date();
  const deadline = p.deadline ? new Date(p.deadline) : null;
  const monthsLeft = deadline ? monthsBetween(now, deadline) : null;
  const needed = deadline ? (monthsLeft && monthsLeft > 0 ? missing / monthsLeft : missing) : null;
  const etaMonths = p.monthly > 0 ? Math.ceil(missing / p.monthly) : null;
  const eta = etaMonths !== null ? addMonths(now, etaMonths) : null;
  const onTrack = deadline && eta ? eta <= deadline : null;
  return { saved, missing, pct, monthsLeft, needed, etaMonths, eta, onTrack, deadline };
}

function ProjectsPage() {
  const [list, setList] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ name: "", emoji: "🎯", target: "", deadline: "", monthly: "", start: "" });

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setList(JSON.parse(raw)); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(list)); }, [list, loaded]);

  const update = (id: string, fn: (p: Project) => Project) => setList((l) => l.map((p) => (p.id === id ? fn(p) : p)));

  const create = () => {
    const target = Number(form.target);
    if (!form.name.trim() || !(target > 0)) return;
    const start = Number(form.start);
    setList((l) => [{
      id: uid(), name: form.name.trim(), emoji: form.emoji, target,
      deadline: form.deadline, monthly: Number(form.monthly) || 0,
      deposits: start > 0 ? [{ id: uid(), amount: start, date: today() }] : [],
    }, ...l]);
    setForm({ name: "", emoji: "🎯", target: "", deadline: "", monthly: "", start: "" });
  };

  const totals = useMemo(() => {
    const t = list.reduce((a, p) => { const s = stats(p); return { target: a.target + p.target, saved: a.saved + Math.min(s.saved, p.target) }; }, { target: 0, saved: 0 });
    return { ...t, pct: t.target ? (t.saved / t.target) * 100 : 0 };
  }, [list]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">Mes projets</h1>
        <p className="mt-2 text-muted-foreground">Une machine à laver, un voyage, un terrain… Voyez combien il faut, combien il manque et où vous en êtes.</p>

        {/* New project */}
        <section className="mt-8 rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold">Nouveau projet</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {IDEAS.map((i) => (
              <button key={i.name} type="button" onClick={() => setForm((f) => ({ ...f, name: i.name, emoji: i.emoji, target: String(i.target) }))}
                className="rounded-full border bg-background px-3 py-1.5 text-sm hover:border-primary hover:text-primary">
                {i.emoji} {i.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Les montants des idées sont des exemples : remplacez-les par le vrai prix.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nom du projet"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Machine à laver" /></Field>
            <Field label="Montant total nécessaire (FCFA)"><Input inputMode="numeric" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value.replace(/\D/g, "") })} placeholder="350000" /></Field>
            <Field label="Déjà mis de côté (FCFA)"><Input inputMode="numeric" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value.replace(/\D/g, "") })} placeholder="0" /></Field>
            <Field label="Je peux mettre par mois (FCFA)"><Input inputMode="numeric" value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value.replace(/\D/g, "") })} placeholder="50000" /></Field>
            <Field label="Date souhaitée (facultatif)"><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
            <div className="flex items-end"><Button className="h-10 w-full" onClick={create} disabled={!form.name.trim() || !(Number(form.target) > 0)}><Plus className="h-4 w-4" />Créer le projet</Button></div>
          </div>
        </section>

        {list.length > 0 && (
          <section className="mt-6 rounded-3xl bg-sidebar p-5 text-sidebar-foreground sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-sm opacity-80">Tous mes projets</p><p className="text-2xl font-bold">{fcfa(totals.saved)} <span className="text-base font-normal opacity-80">/ {fcfa(totals.target)}</span></p></div>
              <p className="text-3xl font-bold">{Math.round(totals.pct)} %</p>
            </div>
            <Bar pct={totals.pct} dark />
          </section>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {list.map((p) => <ProjectCard key={p.id} p={p} onChange={(fn) => update(p.id, fn)} onDelete={() => setList((l) => l.filter((x) => x.id !== p.id))} />)}
        </div>

        {loaded && list.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed p-10 text-center text-muted-foreground">
            <Target className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3">Aucun projet pour l'instant. Choisissez une idée ci-dessus pour commencer.</p>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">Vos projets sont gardés sur cet appareil. <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-primary">Créer un compte</Link></p>
      </main>
    </div>
  );
}

function ProjectCard({ p, onChange, onDelete }: { p: Project; onChange: (fn: (p: Project) => Project) => void; onDelete: () => void }) {
  const s = stats(p);
  const [amt, setAmt] = useState("");
  const [sim, setSim] = useState(p.monthly || 0);
  const simMonths = sim > 0 ? Math.ceil(s.missing / sim) : null;
  const done = s.missing === 0;

  const add = (sign: 1 | -1) => {
    const n = Number(amt);
    if (!(n > 0)) return;
    onChange((x) => ({ ...x, deposits: [{ id: uid(), amount: sign * n, date: today() }, ...x.deposits] }));
    setAmt("");
  };

  return (
    <article className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-2xl">{p.emoji}</span>
          <div><h3 className="font-semibold">{p.name}</h3><p className="text-sm text-muted-foreground">Objectif {fcfa(p.target)}</p></div>
        </div>
        <button onClick={onDelete} aria-label="Supprimer le projet" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-bold text-primary">{Math.round(s.pct)} %</p>
        {done && <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" />Projet financé !</span>}
      </div>
      <Bar pct={s.pct} />

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Il faut" value={fcfa(p.target)} />
        <Stat label="J'ai" value={fcfa(s.saved)} />
        <Stat label="Il manque" value={fcfa(s.missing)} accent />
      </div>

      {!done && (
        <div className="mt-4 space-y-2 rounded-2xl bg-muted/50 p-3 text-sm">
          {s.deadline && (
            <p className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Pour {fmtDate(s.deadline)} : mettre <b>{fcfa(s.needed ?? 0)}</b> par mois{s.monthsLeft === 0 ? " (échéance ce mois-ci)" : ` pendant ${s.monthsLeft} mois`}.
            </p>
          )}
          {s.eta && (
            <p className="flex gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Avec {fcfa(p.monthly)}/mois, atteint vers <b>{fmtDate(s.eta)}</b> ({s.etaMonths} mois).
            </p>
          )}
          {s.onTrack === false && <p className="flex gap-2 text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />À ce rythme, vous serez en retard sur la date souhaitée.</p>}
          {s.onTrack === true && <p className="flex gap-2 text-success"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Vous êtes dans les temps.</p>}
        </div>
      )}

      {/* Simulator */}
      {!done && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Et si je mettais par mois…</span><b>{fcfa(sim)}</b></div>
          <input type="range" min={0} max={Math.max(10000, Math.ceil(s.missing / 1000) * 1000)} step={5000} value={sim} onChange={(e) => setSim(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-primary)]" aria-label="Montant mensuel simulé" />
          <p className="text-sm">{simMonths ? <>→ projet atteint en <b>{simMonths} mois</b>, vers {fmtDate(addMonths(new Date(), simMonths))}.</> : "Choisissez un montant."}</p>
          {sim > 0 && sim !== p.monthly && <button onClick={() => onChange((x) => ({ ...x, monthly: sim }))} className="mt-1 text-sm font-semibold text-primary">Garder ce rythme</button>}
        </div>
      )}

      {/* Deposits */}
      <div className="mt-4 flex gap-2">
        <Input inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))} placeholder="Montant (FCFA)" />
        <Button onClick={() => add(1)} disabled={!(Number(amt) > 0)} aria-label="Ajouter"><Plus className="h-4 w-4" /></Button>
        <Button variant="outline" onClick={() => add(-1)} disabled={!(Number(amt) > 0)} aria-label="Retirer"><Minus className="h-4 w-4" /></Button>
      </div>
      {p.deposits.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-sm">
          {p.deposits.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-muted/50">
              <span className="text-muted-foreground">{new Date(d.date).toLocaleDateString("fr-FR")}</span>
              <span className="flex items-center gap-2">
                <span className={d.amount < 0 ? "text-destructive" : "text-success"}>{d.amount > 0 ? "+" : ""}{fcfa(d.amount)}</span>
                <button onClick={() => onChange((x) => ({ ...x, deposits: x.deposits.filter((y) => y.id !== d.id) }))} aria-label="Supprimer" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium">{label}</span>{children}</label>;
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="rounded-xl bg-muted/50 p-2"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-sm font-semibold ${accent ? "text-warning" : ""}`}>{value}</p></div>;
}
function Bar({ pct, dark }: { pct: number; dark?: boolean }) {
  return <div className={`mt-2 h-3 overflow-hidden rounded-full ${dark ? "bg-sidebar-foreground/20" : "bg-muted"}`}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>;
}
