import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { readsQuery, supabase, useFinance, useInvalidate } from "@/lib/data";
import { computeAlerts, type AlertLevel } from "@/lib/finance";
import { Empty, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/alertes")({
  head: () => ({ meta: [{ title: "Alertes — DOLA" }, { name: "description", content: "Votre centre de notifications." }] }),
  component: Page,
});

const ICON: Record<AlertLevel, typeof Info> = { danger: XCircle, warning: AlertTriangle, info: Info, success: CheckCircle2 };
const TONE: Record<AlertLevel, string> = { danger: "text-destructive bg-destructive/10", warning: "text-warning bg-warning/15", info: "text-primary bg-primary/10", success: "text-success bg-success/10" };

function Page() {
  const { txs, budgets, goals, profile } = useFinance();
  const reads = useSuspenseQuery(readsQuery).data;
  const inv = useInvalidate();
  const alerts = computeAlerts(txs, budgets, goals, profile);
  const unread = alerts.filter((a) => !reads.has(a.key));
  const mark = async (keys: string[]) => {
    if (!keys.length) return;
    await supabase.from("notification_reads").upsert(keys.map((key) => ({ key, user_id: profile.id })));
    await inv("reads");
  };
  return (
    <>
      <PageHeader title="Alertes" subtitle={`${unread.length} non lue(s) · seuil d'alerte à ${profile.alert_threshold} %`} action={
        <div className="flex gap-2"><Button variant="outline" className="rounded-xl" asChild><Link to="/parametres">Configurer</Link></Button><Button variant="soft" onClick={() => mark(unread.map((a) => a.key))}>Tout marquer comme lu</Button></div>} />
      <ul className="space-y-3">
        {alerts.map((a) => {
          const I = ICON[a.level]; const read = reads.has(a.key);
          return (
            <li key={a.key} className={cn("card-surface flex gap-4 p-4 animate-rise", read && "opacity-60")}>
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", TONE[a.level])}><I className="h-5 w-5" /></span>
              <div className="flex-1"><p className="text-sm font-semibold">{a.title}{!read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />}</p><p className="text-sm text-muted-foreground">{a.message}</p></div>
              {!read && <Button size="sm" variant="ghost" onClick={() => mark([a.key])}>Lu</Button>}
            </li>
          );
        })}
      </ul>
      {!alerts.length && <Empty>Aucune alerte pour le moment.</Empty>}
    </>
  );
}
