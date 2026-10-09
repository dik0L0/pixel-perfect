import { createFileRoute } from "@tanstack/react-router";
import { Legend, Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import { useFinance } from "@/lib/data";
import { categoryForecast, fcfa, forecast } from "@/lib/finance";
import { PageHeader, Panel, Empty } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/previsions")({
  head: () => ({ meta: [{ title: "Prévisions intelligentes — DOLA" }, { name: "description", content: "Estimation de votre situation future." }] }),
  component: Page,
});

const k = (n: number) => `${Math.round(n / 1000)}k`;

function Page() {
  const { txs, profile } = useFinance();
  const f = forecast(txs, profile);
  const cats = categoryForecast(txs);
  return (
    <>
      <PageHeader title="Prévisions intelligentes" subtitle="Estimations basées sur votre historique — ce ne sont pas des certitudes." />
      <div className="card-surface bg-gradient-night p-6 text-night-foreground animate-rise">
        <p className="text-sm opacity-70">Situation estimée</p>
        <p className="mt-2 font-display text-xl font-semibold sm:text-2xl">
          {f.avg === 0 ? "Enregistrez vos dépenses pour obtenir une estimation."
            : f.daysLeft !== null && f.daysLeft < 0 ? "Votre solde du mois est déjà négatif."
            : `À votre rythme actuel, votre budget pourrait être épuisé dans ${f.daysLeft} jours.`}
        </p>
        <p className="mt-2 text-sm opacity-70">Solde actuel {fcfa(f.balance)} · {fcfa(f.avg)} dépensés en moyenne par jour</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {(["optimiste", "realiste", "prudent"] as const).map((s) => (
          <div key={s} className="card-surface p-4"><p className="text-xs capitalize text-muted-foreground">Fin de mois · {s === "realiste" ? "réaliste" : s}</p><p className={cn("mt-1 font-display text-lg font-bold", f.endMonth[s] < 0 && "text-destructive")}>{fcfa(f.endMonth[s])}</p></div>
        ))}
        <div className="card-surface p-4"><p className="text-xs text-muted-foreground">Capacité d'épargne / mois</p><p className="mt-1 font-display text-lg font-bold text-success">{fcfa(f.savingsCapacity)}</p></div>
      </div>
      <Panel title="Évolution prévisionnelle du solde" className="mt-5">
        <div className="h-72"><ResponsiveContainer><LineChart data={f.points}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} minTickGap={16} /><YAxis tickFormatter={k} width={44} fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => fcfa(v)} /><Legend /><Line dataKey="optimiste" name="Optimiste" stroke="var(--chart-2)" dot={false} strokeWidth={2} /><Line dataKey="realiste" name="Réaliste" stroke="var(--primary)" dot={false} strokeWidth={2.5} /><Line dataKey="prudent" name="Prudent" stroke="var(--chart-4)" dot={false} strokeWidth={2} strokeDasharray="5 4" /></LineChart></ResponsiveContainer></div>
      </Panel>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Dépenses projetées par catégorie (fin de mois)">
          {cats.length ? <ul className="space-y-2 text-sm">{cats.map((c) => <li key={c.name} className="flex justify-between"><span>{c.name}</span><span><span className="text-muted-foreground">{fcfa(c.value)} → </span><b>{fcfa(c.projected)}</b></span></li>)}</ul> : <Empty>Pas encore de dépenses ce mois-ci.</Empty>}
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Hypothèses utilisées</span>}>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">{f.hypotheses.map((h) => <li key={h}>{h}</li>)}<li>Méthode V1 : moyenne mobile déterministe sur 30 jours.</li></ul>
        </Panel>
      </div>
    </>
  );
}
