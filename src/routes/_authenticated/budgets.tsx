import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Banknote, BookOpen, ChevronLeft, ChevronRight, Copy, DollarSign, Heart,
  Home, PiggyBank, Pencil, Plus, ShoppingBag, Ticket, Trash2, Users, Utensils, Car, Wifi,
} from "lucide-react";
import { supabase, useFinance, useInvalidate } from "@/lib/data";
import { EXPENSE_CATEGORIES, FIXED_CHARGES, budgetColor, byCategory, fcfa, inMonth, monthKey, monthLabel, shiftMonth } from "@/lib/finance";
import { Bar, Empty, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Mes budgets — DOLA" }, { name: "description", content: "Définissez votre budget mensuel, catégorie par catégorie." }] }),
  component: Page,
});

const ICONS: Record<string, typeof Utensils> = {
  Alimentation: Utensils, Logement: Home, Transport: Car, Santé: Heart, Éducation: BookOpen,
  Communication: Wifi, Loisirs: Ticket, Famille: Users, Shopping: ShoppingBag,
  Abonnements: Film, Autres: PiggyBank,
};
const EXAMPLES: Record<string, string> = {
  Logement: "Loyer, électricité, eau",
  Communication: "Internet, forfait, crédit",
  Abonnements: "Netflix, Canal+, Spotify",
  Transport: "Essence, taxi, bus",
  Alimentation: "Courses, marché, restaurant",
  Santé: "Pharmacie, consultation",
  Éducation: "Scolarité, fournitures",
  Loisirs: "Sorties, sport, divertissement",
  Famille: "Entraide, cadeaux",
  Shopping: "Vêtements, achats divers",
  Autres: "Tout ce qui ne rentre pas ailleurs",
};

function Page() {
  const { txs, budgets, profile } = useFinance();
  const inv = useInvalidate();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [editing, setEditing] = useState<string | null>(null);
  const [amt, setAmt] = useState("");

  const list = useMemo(() => budgets.filter((b) => b.month === month), [budgets, month]);
  const byCat = useMemo(() => new Map(list.map((b) => [b.category, b])), [list]);
  const spent = new Map(byCategory(inMonth(txs, month)).map((c) => [c.name, c.value]));
  const total = list.reduce((s, b) => s + b.amount, 0);
  const used = list.reduce((s, b) => s + (spent.get(b.category) ?? 0), 0);

  const fixedSuggest = useMemo(() => {
    const targets = new Set(FIXED_CHARGES.map(([, , cat]) => cat));
    return [...targets].some((cat) => !byCat.has(cat) && Number(profile.fixed_charges?.[FIXED_CHARGES.find((f) => f[2] === cat)?.[0] ?? ""] ?? 0) > 0);
  }, [byCat, profile]);

  const prefillFixed = async () => {
    const rows = FIXED_CHARGES.map(([key, , cat]) => ({ month, category: cat, amount: Number(profile.fixed_charges?.[key] ?? 0), user_id: profile.id })).filter((r) => r.amount > 0);
    if (!rows.length) { toast.error("Aucune charge fixe renseignée"); return; }
    const { error } = await supabase.from("budgets").upsert(rows, { onConflict: "user_id,month,category" });
    if (error) { toast.error(error.message); return; }
    await inv("budgets"); toast.success("Charges fixes ajoutées au budget");
  };

  const save = async (category: string) => {
    const value = Number(amt);
    if (!value || value <= 0) { setEditing(null); return; }
    const { error } = await supabase.from("budgets").upsert({ month, category, amount: value, user_id: profile.id }, { onConflict: "user_id,month,category" });
    if (error) { toast.error(error.message); return; }
    setEditing(null); setAmt(""); await inv("budgets");
  };
  const copyPrev = async () => {
    const prev = budgets.filter((b) => b.month === shiftMonth(month, -1));
    if (!prev.length) { toast.error("Aucun budget le mois précédent"); return; }
    await supabase.from("budgets").upsert(prev.map((b) => ({ month, category: b.category, amount: b.amount, user_id: profile.id })), { onConflict: "user_id,month,category" });
    await inv("budgets"); toast.success("Budgets copiés");
  };

  return (
    <>
      <PageHeader
        title="Mes budgets"
        subtitle={total ? `${fcfa(used)} consommés sur ${fcfa(total)} prévus — reste ${fcfa(Math.max(0, total - used))}` : "Décidez combien vous dépensez dans chaque catégorie."}
        action={
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" aria-label="Mois précédent" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft /></Button>
            <span className="w-24 text-center text-sm font-semibold capitalize">{monthLabel(month)}</span>
            <Button size="icon" variant="outline" aria-label="Mois suivant" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight /></Button>
            <Button variant="outline" className="rounded-xl" onClick={copyPrev}><Copy />Copier le mois précédent</Button>
          </div>
        }
      />

      {fixedSuggest && (
        <div className="card-surface mb-5 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
          <p className="text-sm"><span className="font-semibold">Vos charges fixes sont déjà connues.</span> Les ajouter à ce mois ?</p>
          <Button variant="hero" size="sm" className="rounded-xl" onClick={prefillFixed}><Plus />Préremplir</Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EXPENSE_CATEGORIES.map((cat) => {
          const b = byCat.get(cat);
          const Icon = ICONS[cat] ?? Banknote;
          const s = spent.get(cat) ?? 0;
          const p = b?.amount ? (s / b.amount) * 100 : 0;
          const tone = budgetColor(p);
          const isEditing = editing === cat;
          return (
            <div key={cat} className={cn("card-surface flex flex-col p-5 animate-rise", !b && "border-dashed opacity-90")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="font-semibold leading-tight">{cat}</p>
                    <p className="text-xs text-muted-foreground">{EXAMPLES[cat]}</p>
                  </div>
                </div>
                {b && (
                  <button aria-label={`Supprimer le budget ${cat}`} onClick={async () => { await supabase.from("budgets").delete().eq("id", b.id); inv("budgets"); }}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="mt-4 flex gap-2">
                  <Input
                    autoFocus type="number" min={0} placeholder="Montant FCFA" value={amt}
                    onChange={(e) => setAmt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") save(cat); if (e.key === "Escape") setEditing(null); }}
                    className="h-10 rounded-xl"
                  />
                  <Button size="sm" variant="hero" className="rounded-xl" onClick={() => save(cat)}>OK</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setAmt(""); }}>Annuler</Button>
                </div>
              ) : b ? (
                <>
                  <div className="mt-4"><Bar value={p} tone={tone} /></div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span>Consommé {fcfa(s)}</span>
                    <span className={cn(b.amount - s < 0 && "font-semibold text-destructive")}>Restant {fcfa(b.amount - s)}</span>
                  </div>
                  {p >= profile.alert_threshold && (
                    <p className="mt-3 rounded-lg bg-warning/10 p-2 text-xs">
                      ⚠️ {p >= 100 ? "Budget dépassé." : `Attention : ${p.toFixed(0)} % de votre budget ${cat.toLowerCase()} est déjà utilisé.`}
                    </p>
                  )}
                  <button onClick={() => { setEditing(cat); setAmt(String(b.amount)); }} className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    <Pencil className="h-3 w-3" />Modifier {fcfa(b.amount)}
                  </button>
                </>
              ) : (
                <button onClick={() => { setEditing(cat); setAmt(""); }} className="mt-4 flex items-center gap-1 self-start rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10">
                  <DollarSign className="h-3.5 w-3.5" />Définir un montant
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!list.length && <div className="mt-5"><Empty>Aucun budget pour ce mois. Cliquez sur « Définir un montant » dans une catégorie ci-dessus.</Empty></div>}
    </>
  );
}
