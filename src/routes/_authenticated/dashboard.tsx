import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar as RBar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Lightbulb, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { useFinance } from "@/lib/data";
import { byCategory, computeAlerts, fcfa, forecast, goalStats, inMonth, initialBudget, monthKey, monthlySeries, nextPayday, recommendations, shiftMonth, totals, variation, FIXED_CHARGES } from "@/lib/finance";
import { Bar, CHART_COLORS, Empty, PageHeader, Panel, tooltipStyle } from "@/components/ui-kit";
import { TxDialog } from "@/components/TxDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — DOLA" }, { name: "description", content: "Votre situation financière du jour." }] }),
  component: Dashboard,
});

const k = (n: number) => `${Math.round(n / 1000)}k`;

function Dashboard() {
  const { profile, txs, budgets, goals } = useFinance();
  const month = monthKey(new Date());
  const cur = totals(inMonth(txs, month));
  const prev = totals(inMonth(txs, shiftMonth(month, -1)));
  const saving = initialBudget(profile).saving;
  const series = monthlySeries(txs, 6);
  const cats = byCategory(inMonth(txs, month));
  const f = forecast(txs, profile);
  const alerts = computeAlerts(txs, budgets, goals, profile).filter((a) => a.level !== "info").slice(0, 3);
  const pay = nextPayday(profile.payday);
  const kpis = [
    { l: "Revenus du mois", v: cur.income, p: prev.income, icon: Wallet, tone: "text-primary bg-primary/10", good: true },
    { l: "Dépenses du mois", v: cur.expense, p: prev.expense, icon: ArrowDownRight, tone: "text-destructive bg-destructive/10", good: false },
    { l: "Solde disponible", v: cur.net, p: prev.net, icon: TrendingUp, tone: "text-success bg-success/10", good: true },
    { l: "Épargne prévue", v: saving, p: null, icon: PiggyBank, tone: "text-warning bg-warning/15", good: true },
  ];

  return (
    <>
      <PageHeader title={`Bonjour, ${profile.first_name || "à vous"} 👋`} subtitle="Voici votre situation financière aujourd'hui." action={<TxDialog />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {kpis.map(({ l, v, p, icon: I, tone, good }) => {
          const d = p === null ? null : variation(v, p);
          const positive = d !== null && (good ? d >= 0 : d <= 0);
          return (
            <div key={l} className="card-surface p-4 animate-rise sm:p-5">
              <div className="flex items-center justify-between"><span className={cn("grid h-9 w-9 place-items-center rounded-xl", tone)}><I className="h-4 w-4" /></span>
                {d !== null && <span className={cn("flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>{d >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(d).toFixed(0)} %</span>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{l}</p>
              <p className="font-display text-lg font-bold sm:text-xl">{fcfa(v)}</p>
              <p className="text-[11px] text-muted-foreground">{p === null ? "Objectif mensuel (10 %)" : "vs mois précédent"}</p>
            </div>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <div className="mt-5 space-y-2">
          {alerts.map((a) => <Link to="/alertes" key={a.key} className={cn("block rounded-xl border p-3 text-sm", a.level === "danger" ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10")}><b>{a.title}</b> — {a.message}</Link>)}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Revenus et dépenses">
          <div className="h-60"><ResponsiveContainer><BarChart data={series}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" /><YAxis tickFormatter={k} fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" width={40} /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fcfa(v)} /><RBar dataKey="revenus" name="Revenus" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /><RBar dataKey="depenses" name="Dépenses" fill="var(--chart-4)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Dépenses par catégorie">
          {cats.length ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-52 w-52 shrink-0"><ResponsiveContainer><PieChart><Pie data={cats} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>{cats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fcfa(v)} /></PieChart></ResponsiveContainer></div>
              <ul className="w-full space-y-1.5 text-sm">{cats.slice(0, 6).map((c, i) => <li key={c.name} className="flex justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{c.name}</span><b>{fcfa(c.value)}</b></li>)}</ul>
            </div>
          ) : <Empty>Aucune dépense ce mois-ci.</Empty>}
        </Panel>
        <Panel title="Évolution du solde">
          <div className="h-56"><ResponsiveContainer><AreaChart data={series}><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" /><YAxis tickFormatter={k} fontSize={11} width={40} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fcfa(v)} /><Area dataKey="solde" name="Solde cumulé" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#sg)" /></AreaChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Prévision jusqu'à la prochaine paie" action={<Link to="/previsions" className="text-xs font-semibold text-primary">Détails</Link>}>
          <div className="h-56"><ResponsiveContainer><LineChart data={f.points}><XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" minTickGap={20} /><YAxis tickFormatter={k} fontSize={11} width={40} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" /><Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fcfa(v)} /><Line dataKey="realiste" name="Réaliste" stroke="var(--primary)" strokeWidth={2.5} dot={false} /><Line dataKey="prudent" name="Prudent" stroke="var(--chart-4)" strokeDasharray="4 4" dot={false} /></LineChart></ResponsiveContainer></div>
          <p className="mt-2 text-xs text-muted-foreground">Estimation, non garantie. {f.daysLeft !== null && f.daysLeft >= 0 ? `À votre rythme actuel, votre budget pourrait tenir environ ${f.daysLeft} jours.` : ""}</p>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Transactions récentes" className="lg:col-span-2" action={<Link to="/transactions" className="text-xs font-semibold text-primary">Tout voir</Link>}>
          {txs.length ? <ul className="divide-y">{txs.slice(0, 6).map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
              <div><p className="font-medium">{t.description || t.category}</p><p className="text-xs text-muted-foreground">{t.category} · {t.payment_method} · {new Date(t.date).toLocaleDateString("fr-FR")}</p></div>
              <span className={cn("font-semibold", t.type === "revenu" ? "text-success" : "text-foreground")}>{t.type === "revenu" ? "+" : "−"}{fcfa(t.amount)}</span>
            </li>))}</ul> : <Empty>Ajoutez votre première transaction pour commencer.</Empty>}
        </Panel>
        <div className="space-y-5">
          <Panel title="Prochaines échéances">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>💰 Salaire attendu</span><b>{pay.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</b></li>
              {FIXED_CHARGES.filter(([key]) => (profile.fixed_charges?.[key] ?? 0) > 0).slice(0, 4).map(([key, l]) => <li key={key} className="flex justify-between text-muted-foreground"><span>{l}</span><span>{fcfa(profile.fixed_charges[key] ?? 0)}</span></li>)}
            </ul>
          </Panel>
          <Panel title="Objectifs d'épargne" action={<Link to="/objectifs" className="text-xs font-semibold text-primary">Gérer</Link>}>
            {goals.length ? goals.slice(0, 3).map((g) => { const s = goalStats(g); return <div key={g.id} className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{g.name}</span><span className="text-muted-foreground">{s.progress.toFixed(0)} %</span></div><Bar value={s.progress} tone="success" /></div>; }) : <Empty>Aucun objectif.</Empty>}
          </Panel>
        </div>
      </div>

      <Panel title={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-warning" />Recommandations</span>} className="mt-5">
        <ul className="space-y-2 text-sm">{recommendations(txs, budgets, profile).map((r) => <li key={r} className="rounded-xl bg-muted p-3">{r}</li>)}</ul>
      </Panel>
    </>
  );
}
