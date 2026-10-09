import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Copy, Trash2 } from "lucide-react";
import { supabase, useFinance, useInvalidate } from "@/lib/data";
import { EXPENSE_CATEGORIES, budgetColor, byCategory, fcfa, inMonth, monthKey, monthLabel, shiftMonth } from "@/lib/finance";
import { Bar, Empty, PageHeader, Panel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Mes budgets — MONÉO" }, { name: "description", content: "Budgets mensuels par catégorie." }] }),
  component: Page,
});

function Page() {
  const { txs, budgets, profile } = useFinance();
  const inv = useInvalidate();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [cat, setCat] = useState("Alimentation");
  const [amt, setAmt] = useState("");
  const list = budgets.filter((b) => b.month === month);
  const spent = new Map(byCategory(inMonth(txs, month)).map((c) => [c.name, c.value]));
  const total = list.reduce((s, b) => s + b.amount, 0);
  const used = list.reduce((s, b) => s + (spent.get(b.category) ?? 0), 0);

  const save = async () => {
    if (!(+amt > 0)) return;
    const { error } = await supabase.from("budgets").upsert({ month, category: cat, amount: +amt, user_id: profile.id }, { onConflict: "user_id,month,category" });
    if (error) return toast.error(error.message);
    setAmt(""); await inv("budgets");
  };
  const copyPrev = async () => {
    const prev = budgets.filter((b) => b.month === shiftMonth(month, -1));
    if (!prev.length) return toast.error("Aucun budget le mois précédent");
    await supabase.from("budgets").upsert(prev.map((b) => ({ month, category: b.category, amount: b.amount, user_id: profile.id })), { onConflict: "user_id,month,category" });
    await inv("budgets"); toast.success("Budgets copiés");
  };

  return (
    <>
      <PageHeader title="Mes budgets" subtitle={`${fcfa(used)} consommés sur ${fcfa(total)}`} action={
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft /></Button>
          <span className="w-24 text-center text-sm font-semibold capitalize">{monthLabel(month)}</span>
          <Button size="icon" variant="outline" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight /></Button>
          <Button variant="outline" className="rounded-xl" onClick={copyPrev}><Copy />Copier le mois précédent</Button>
        </div>} />
      <Panel title="Définir un budget">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={cat} onValueChange={setCat}><SelectTrigger className="h-11 rounded-xl sm:w-56"><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Input type="number" placeholder="Montant FCFA" value={amt} onChange={(e) => setAmt(e.target.value)} className="h-11 rounded-xl" />
          <Button variant="hero" className="h-11" onClick={save}>Enregistrer</Button>
        </div>
      </Panel>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {list.map((b) => {
          const s = spent.get(b.category) ?? 0;
          const p = b.amount ? (s / b.amount) * 100 : 0;
          const tone = budgetColor(p);
          return (
            <div key={b.id} className="card-surface p-5 animate-rise">
              <div className="flex items-start justify-between">
                <div><p className="font-semibold">{b.category}</p><p className="text-xs text-muted-foreground">Prévu {fcfa(b.amount)}</p></div>
                <div className="flex items-center gap-2"><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/15 text-warning-foreground" : "bg-destructive/10 text-destructive")}>{p.toFixed(0)} %</span>
                  <button aria-label="Supprimer" onClick={async () => { await supabase.from("budgets").delete().eq("id", b.id); inv("budgets"); }}><Trash2 className="h-4 w-4 text-muted-foreground" /></button></div>
              </div>
              <div className="mt-4"><Bar value={p} tone={tone} /></div>
              <div className="mt-2 flex justify-between text-xs"><span>Consommé {fcfa(s)}</span><span className={cn(b.amount - s < 0 && "font-semibold text-destructive")}>Restant {fcfa(b.amount - s)}</span></div>
              {p >= profile.alert_threshold && <p className="mt-3 rounded-lg bg-warning/10 p-2 text-xs">⚠️ {p >= 100 ? "Budget dépassé." : `Attention : ${p.toFixed(0)} % de votre budget ${b.category.toLowerCase()} est déjà utilisé.`}</p>}
            </div>
          );
        })}
      </div>
      {!list.length && <div className="mt-5"><Empty>Aucun budget pour ce mois.</Empty></div>}
    </>
  );
}
