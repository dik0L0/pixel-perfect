import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, Bar as RBar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles } from "lucide-react";
import { useFinance } from "@/lib/data";
import { byCategory, fcfa, insights, monthKey, monthlySeries, pct, shiftMonth, totals, toISO } from "@/lib/finance";
import { PageHeader, Panel, tooltipStyle } from "@/components/ui-kit";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/statistiques")({
  head: () => ({ meta: [{ title: "Statistiques — MONÉO" }, { name: "description", content: "Analyse de vos finances." }] }),
  component: Page,
});

const PERIODS = { mois: 1, trimestre: 3, annee: 12 } as const;
const k = (n: number) => `${Math.round(n / 1000)}k`;

function Page() {
  const { txs } = useFinance();
  const [period, setPeriod] = useState<keyof typeof PERIODS>("mois");
  const n = PERIODS[period];
  const end = monthKey(new Date());
  const start = shiftMonth(end, -(n - 1));
  const prevStart = shiftMonth(start, -n);
  const inRange = (a: string, b: string) => txs.filter((t) => t.date.slice(0, 7) >= a && t.date.slice(0, 7) <= b);
  const cur = inRange(start, end), prev = inRange(prevStart, shiftMonth(start, -1));
  const tc = totals(cur), tp = totals(prev);
  const today = new Date();
  const firstDay = new Date(+start.slice(0, 4), +start.slice(5) - 1, 1);
  const days = Math.max(1, Math.round((+today - +firstDay) / 86400000) + 1);
  const series = monthlySeries(txs, Math.max(6, n));
  const cats = byCategory(cur);
  const prevCats = new Map(byCategory(prev).map((c) => [c.name, c.value]));
  const compare = cats.slice(0, 8).map((c) => ({ name: c.name, actuel: c.value, precedent: prevCats.get(c.name) ?? 0 }));

  const ind = [
    ["Taux d'épargne", pct(tc.savingsRate), "Épargne nette / Revenus × 100"],
    ["Taux de consommation", pct(tc.consumptionRate), "Dépenses / Revenus × 100"],
    ["Dépense quotidienne moyenne", fcfa(tc.expense / days), `Dépenses cumulées / ${days} jours écoulés`],
    ["Épargne nette", fcfa(tc.net), `Période précédente : ${fcfa(tp.net)}`],
  ];

  return (
    <>
      <PageHeader title="Statistiques" subtitle={`Du ${toISO(firstDay).split("-").reverse().join("/")} à aujourd'hui`} action={
        <Tabs value={period} onValueChange={(v) => setPeriod(v as keyof typeof PERIODS)}><TabsList><TabsTrigger value="mois">Mois</TabsTrigger><TabsTrigger value="trimestre">Trimestre</TabsTrigger><TabsTrigger value="annee">Année</TabsTrigger></TabsList></Tabs>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ind.map(([l, v, h]) => <div key={l} className="card-surface p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-display text-xl font-bold">{v}</p><p className="mt-1 text-[11px] text-muted-foreground">{h}</p></div>)}
      </div>
      {tc.income === 0 && <p className="mt-3 text-xs text-muted-foreground">Revenus nuls sur la période : les taux ne sont pas calculables. Les remboursements réduisent les dépenses ; les transactions exceptionnelles sont incluses dans les totaux mais exclues des prévisions.</p>}

      <Panel title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Analyses automatiques</span>} className="mt-5">
        <ul className="space-y-2 text-sm">{insights(txs).map((i) => <li key={i} className="rounded-xl bg-primary/5 p-3">{i}</li>)}{!insights(txs).length && <li className="text-muted-foreground">Pas encore assez d'historique.</li>}</ul>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Évolution des revenus">
          <div className="h-56"><ResponsiveContainer><AreaChart data={series}><XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} /><YAxis tickFormatter={k} width={40} fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fcfa(v)} /><Area dataKey="revenus" name="Revenus" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Évolution de l'épargne">
          <div className="h-56"><ResponsiveContainer><LineChart data={series}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} /><YAxis tickFormatter={k} width={40} fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fcfa(v)} /><Line dataKey="epargne" name="Épargne nette" stroke="var(--chart-2)" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Comparaison par catégorie (vs période précédente)" className="lg:col-span-2">
          <div className="h-72"><ResponsiveContainer><BarChart data={compare}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} /><YAxis tickFormatter={k} width={40} fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fcfa(v)} /><Legend /><RBar dataKey="actuel" name="Période actuelle" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /><RBar dataKey="precedent" name="Période précédente" fill="var(--chart-5)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Catégories les plus coûteuses" className="lg:col-span-2">
          <ol className="space-y-2">{cats.slice(0, 5).map((c, i) => <li key={c.name} className="flex justify-between text-sm"><span>{i + 1}. {c.name}</span><b>{fcfa(c.value)} <span className="font-normal text-muted-foreground">({pct(tc.expense ? (c.value / tc.expense) * 100 : null)})</span></b></li>)}</ol>
        </Panel>
      </div>
    </>
  );
}
