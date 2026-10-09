import { useState, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { categoriesQuery, supabase, useInvalidate } from "@/lib/data";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, toISO, type Tx, type TxType } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";

export function TxDialog({ tx, trigger }: { tx?: Tx; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const custom = useSuspenseQuery(categoriesQuery).data;
  const inv = useInvalidate();
  const [f, setF] = useState(() => tx ?? { type: "depense" as TxType, amount: 0, category: "Alimentation", date: toISO(new Date()), description: "", payment_method: "Espèces", exceptional: false });
  const cats = f.type === "depense"
    ? [...EXPENSE_CATEGORIES, ...custom.filter((c) => c.kind === "depense").map((c) => c.name)]
    : [...INCOME_CATEGORIES, ...custom.filter((c) => c.kind === "revenu").map((c) => c.name)];

  const save = async () => {
    if (!(f.amount > 0)) { toast.error("Montant invalide"); return; }
    setSaving(true);
    const row = { type: f.type, amount: f.amount, category: f.category, date: f.date, description: f.description, payment_method: f.payment_method, exceptional: f.exceptional };
    const { error } = tx ? await supabase.from("transactions").update(row).eq("id", tx.id) : await supabase.from("transactions").insert(row);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await inv("transactions");
    toast.success(tx ? "Transaction modifiée" : "Transaction ajoutée");
    setOpen(false);
    if (!tx) setF({ ...f, amount: 0, description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="hero"><Plus />Ajouter</Button>}</DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{tx ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["depense", "revenu"] as const).map((t) => (
            <button key={t} onClick={() => setF({ ...f, type: t, category: t === "depense" ? "Alimentation" : "Salaire" })} className={cn("rounded-lg py-2 text-sm font-semibold", f.type === t && "bg-card shadow-soft", f.type === t && (t === "revenu" ? "text-success" : "text-destructive"))}>{t === "depense" ? "Dépense" : "Revenu"}</button>
          ))}
        </div>
        <div className="space-y-3">
          <div><Label>Montant (FCFA)</Label><Input type="number" inputMode="numeric" min={0} value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} className="mt-1.5 h-12 rounded-xl font-display text-lg" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Catégorie</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Date</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="mt-1.5 h-11 rounded-xl" /></div>
          </div>
          <div><Label>Moyen de paiement</Label>
            <Select value={f.payment_method} onValueChange={(v) => setF({ ...f, payment_method: v })}><SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Description</Label><Input value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ex. Marché Mont-Bouët" className="mt-1.5 h-11 rounded-xl" /></div>
          <label className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>Transaction exceptionnelle<span className="block text-xs text-muted-foreground">Exclue des moyennes de prévision</span></span><Switch checked={f.exceptional} onCheckedChange={(v) => setF({ ...f, exceptional: v })} /></label>
        </div>
        <Button variant="hero" className="h-11" onClick={save} disabled={saving}>{saving ? <><Spinner size="sm" className="border-primary-foreground border-t-transparent" />Enregistrement…</> : "Enregistrer"}</Button>
      </DialogContent>
    </Dialog>
  );
}
