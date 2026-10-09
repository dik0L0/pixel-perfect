import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Search, Trash2, Upload, Tag } from "lucide-react";
import { categoriesQuery, supabase, txQuery, useInvalidate } from "@/lib/data";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, fcfa, totals } from "@/lib/finance";
import { PageHeader, Panel, Empty } from "@/components/ui-kit";
import { TxDialog } from "@/components/TxDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions — DOLA" }, { name: "description", content: "Vos revenus et dépenses." }] }),
  component: Page,
});

function Page() {
  const txs = useSuspenseQuery(txQuery).data;
  const custom = useSuspenseQuery(categoriesQuery).data;
  const inv = useInvalidate();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [cat, setCat] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...custom.map((c) => c.name)];

  const list = useMemo(() => txs.filter((t) =>
    (type === "all" || t.type === type) && (cat === "all" || t.category === cat) &&
    (!from || t.date >= from) && (!to || t.date <= to) &&
    (!min || t.amount >= +min) && (!max || t.amount <= +max) &&
    (!q || `${t.description} ${t.category} ${t.payment_method}`.toLowerCase().includes(q.toLowerCase()))), [txs, q, type, cat, from, to, min, max]);
  const sum = totals(list);

  const del = async (id: string) => {
    if (!confirm("Supprimer cette transaction ?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    await inv("transactions");
    toast.success("Transaction supprimée");
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const sep = (lines[0] ?? "").includes(";") ? ";" : ",";
    const head = (lines[0] ?? "").toLowerCase().split(sep).map((h) => h.trim());
    const idx = (n: string[]) => head.findIndex((h) => n.some((x) => h.includes(x)));
    const iDate = idx(["date"]), iType = idx(["type"]), iAmt = idx(["montant", "amount"]), iCat = idx(["cat"]), iDesc = idx(["desc", "libell"]), iPay = idx(["moyen", "paiement"]);
    if (iDate < 0 || iAmt < 0) return toast.error("Colonnes requises : date, montant");
    const rows = lines.slice(1).map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""))).map((cells) => {
      const c = (i: number) => cells[i] ?? "";
      const raw = Number(c(iAmt).replace(/\s/g, "").replace(",", "."));
      const t = iType >= 0 ? (c(iType).toLowerCase().startsWith("r") ? "revenu" : "depense") : raw < 0 ? "depense" : "revenu";
      const d = c(iDate).includes("/") ? c(iDate).split("/").reverse().join("-") : c(iDate);
      return { date: d, type: t, amount: Math.abs(raw), category: (iCat >= 0 && c(iCat)) || "Autres", description: iDesc >= 0 ? c(iDesc) : null, payment_method: (iPay >= 0 && c(iPay)) || "Autre" };
    }).filter((r) => r.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date));
    if (!rows.length) return toast.error("Aucune ligne valide trouvée");
    const { error } = await supabase.from("transactions").insert(rows);
    if (error) return toast.error(error.message);
    await inv("transactions");
    toast.success(`${rows.length} transactions importées`);
  };

  return (
    <>
      <PageHeader title="Transactions" subtitle={`${list.length} opérations · +${fcfa(sum.income)} / −${fcfa(sum.expense)}`} action={
        <div className="flex flex-wrap gap-2">
          <CategoryDialog />
          <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />
          <Button variant="outline" className="rounded-xl" onClick={() => fileRef.current?.click()}><Upload />Importer CSV</Button>
          <TxDialog />
        </div>} />
      <Panel>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 rounded-xl pl-9" /></div>
          <Select value={type} onValueChange={setType}><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous types</SelectItem><SelectItem value="revenu">Revenus</SelectItem><SelectItem value="depense">Dépenses</SelectItem></SelectContent></Select>
          <Select value={cat} onValueChange={setCat}><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes catégories</SelectItem>{[...new Set(allCats)].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-xl" aria-label="Du" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-xl" aria-label="Au" />
          <Input type="number" placeholder="Montant min" value={min} onChange={(e) => setMin(e.target.value)} className="h-10 rounded-xl" />
          <Input type="number" placeholder="Montant max" value={max} onChange={(e) => setMax(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Format CSV : date;type;montant;categorie;description;moyen. DOLA ne demande jamais de code PIN ni de mot de passe bancaire.</p>
        <ul className="mt-4 divide-y">
          {list.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold", t.type === "revenu" ? "bg-success/10 text-success" : "bg-muted")}>{t.category.slice(0, 2)}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.description || t.category}{t.exceptional && <span className="ml-2 rounded bg-warning/15 px-1.5 text-[10px] text-warning-foreground">exceptionnelle</span>}</p><p className="text-xs text-muted-foreground">{t.category} · {t.payment_method} · {new Date(t.date).toLocaleDateString("fr-FR")}</p></div>
              <span className={cn("text-sm font-semibold", t.type === "revenu" && "text-success")}>{t.type === "revenu" ? "+" : "−"}{fcfa(t.amount)}</span>
              <TxDialog tx={t} trigger={<Button size="icon" variant="ghost" aria-label="Modifier"><Pencil /></Button>} />
              <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => del(t.id)}><Trash2 className="text-destructive" /></Button>
            </li>
          ))}
        </ul>
        {!list.length && <Empty>Aucune transaction ne correspond.</Empty>}
      </Panel>
    </>
  );
}

function CategoryDialog() {
  const custom = useSuspenseQuery(categoriesQuery).data;
  const inv = useInvalidate();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("depense");
  const add = async () => {
    if (!name.trim()) return;
    await supabase.from("categories").insert({ name: name.trim(), kind });
    setName(""); await inv("categories");
  };
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" className="rounded-xl"><Tag />Catégories</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>Catégories personnalisées</DialogTitle></DialogHeader>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Tontine" className="rounded-xl" />
          <Select value={kind} onValueChange={setKind}><SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="depense">Dépense</SelectItem><SelectItem value="revenu">Revenu</SelectItem></SelectContent></Select>
          <Button onClick={add}>Ajouter</Button>
        </div>
        <ul className="space-y-1">{custom.map((c) => <li key={c.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">{c.name} <span className="text-xs text-muted-foreground">{c.kind}</span><button onClick={async () => { await supabase.from("categories").delete().eq("id", c.id); inv("categories"); }}><Trash2 className="h-4 w-4 text-destructive" /></button></li>)}</ul>
      </DialogContent>
    </Dialog>
  );
}
