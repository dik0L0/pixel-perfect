import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useFinance } from "@/lib/data";
import { fcfa, simulatePurchase, toISO } from "@/lib/finance";
import { PageHeader, Panel } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/simulations")({
  head: () => ({ meta: [{ title: "Simulations — MONÉO" }, { name: "description", content: "Simulez un achat avant de le faire." }] }),
  component: Page,
});

function Page() {
  const { txs, profile } = useFinance();
  const [name, setName] = useState("Téléphone");
  const [amount, setAmount] = useState(150000);
  const [date, setDate] = useState(toISO(new Date()));
  const [res, setRes] = useState<ReturnType<typeof simulatePurchase> | null>(null);
  const run = () => setRes(simulatePurchase(txs, profile, amount, new Date(date)));

  return (
    <>
      <PageHeader title="Simulations" subtitle="Puis-je me permettre cet achat ?" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Votre projet d'achat">
          <div className="space-y-3">
            <div><Label>Nom de l'achat</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11 rounded-xl" /></div>
            <div><Label>Montant (FCFA)</Label><Input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className="mt-1.5 h-11 rounded-xl" /></div>
            <div><Label>Date prévue</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 h-11 rounded-xl" /></div>
            <Button variant="hero" className="h-11 w-full" onClick={run}>Simuler</Button>
          </div>
        </Panel>
        {res && (
          <Panel title={`Résultat : ${name}`}>
            <div className={cn("flex gap-3 rounded-xl p-4 text-sm font-medium", res.compatible ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {res.compatible ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
              {res.compatible ? "Cet achat semble compatible avec votre budget actuel." : "Cet achat pourrait compromettre votre budget du mois."}
            </div>
            <dl className="mt-4 divide-y text-sm">
              {[["Solde estimé à la date d'achat", res.before], ["Solde après achat", res.after], ["Solde estimé en fin de mois", res.endAfter], ["Charges fixes mensuelles", res.fixed], ["Épargne impactée", res.savingsImpact]].map(([l, v]) => (
                <div key={l as string} className="flex justify-between py-2"><dt className="text-muted-foreground">{l}</dt><dd className={cn("font-semibold", (v as number) < 0 && "text-destructive")}>{fcfa(v as number)}</dd></div>
              ))}
              <div className="flex justify-between py-2"><dt className="text-muted-foreground">Risque de déficit</dt><dd className="font-semibold capitalize">{res.risk}</dd></div>
            </dl>
            {res.suggested && <p className="mt-3 rounded-xl bg-primary/5 p-3 text-sm">💡 Date plus favorable : après votre prochaine paie, le <b>{res.suggested.toLocaleDateString("fr-FR")}</b>.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Estimation basée sur votre dépense moyenne de {fcfa(res.forecast.avg)}/jour (scénario réaliste).</p>
          </Panel>
        )}
      </div>
    </>
  );
}
