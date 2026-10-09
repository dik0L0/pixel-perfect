import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase, useFinance, useInvalidate } from "@/lib/data";
import { fcfa, forecast, goalEta, goalStats, type Goal } from "@/lib/finance";
import { Bar, Empty, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/objectifs")({
  head: () => ({ meta: [{ title: "Mes objectifs — MONÉO" }, { name: "description", content: "Vos objectifs d'épargne." }] }),
  component: Page,
});

const EXAMPLES = ["Acheter un ordinateur", "Préparer la rentrée scolaire", "Acheter un terrain", "Financer un voyage", "Créer un fonds d'urgence"];

function Page() {
  const { goals, txs, profile } = useFinance();
  const capacity = forecast(txs, profile).savingsCapacity;
  return (
    <>
      <PageHeader title="Mes objectifs" subtitle={`Capacité d'épargne estimée : ${fcfa(capacity)} / mois`} action={<GoalDialog />} />
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => <GoalCard key={g.id} g={g} capacity={capacity} />)}
      </div>
      {!goals.length && <Empty>Créez votre premier objectif : {EXAMPLES.join(", ")}…</Empty>}
      <p className="mt-6 text-xs text-muted-foreground">Les contributions sont des enregistrements manuels de votre épargne, pas des transferts bancaires réels.</p>
    </>
  );
}

function GoalCard({ g, capacity }: { g: Goal; capacity: number }) {
  const inv = useInvalidate();
  const [amt, setAmt] = useState("");
  const s = goalStats(g);
  const eta = goalEta(g, capacity);
  const contribute = async () => {
    if (!(+amt > 0)) return;
    await supabase.from("goal_contributions").insert({ goal_id: g.id, amount: +amt });
    await supabase.from("goals").update({ saved: g.saved + +amt }).eq("id", g.id);
    setAmt(""); await inv("goals"); toast.success("Contribution enregistrée");
  };
  return (
    <div className="card-surface p-5 animate-rise">
      <div className="flex justify-between">
        <div><p className="font-semibold">{g.name}</p><p className="text-xs capitalize text-muted-foreground">Priorité {g.priority}{g.target_date && ` · pour le ${new Date(g.target_date).toLocaleDateString("fr-FR")}`}</p></div>
        <button aria-label="Supprimer" onClick={async () => { if (confirm("Supprimer cet objectif ?")) { await supabase.from("goals").delete().eq("id", g.id); inv("goals"); } }}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <p className="mt-3 font-display text-xl font-bold">{fcfa(g.saved)} <span className="text-sm font-normal text-muted-foreground">/ {fcfa(g.target)}</span></p>
      <div className="mt-2"><Bar value={s.progress} tone="success" /></div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div><p className="text-muted-foreground">Restant</p><b>{fcfa(s.remaining)}</b></div>
        <div><p className="text-muted-foreground">Par mois</p><b>{s.monthly === null ? "—" : fcfa(s.monthly)}</b></div>
        <div><p className="text-muted-foreground">Atteinte estimée</p><b>{eta ? eta.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "—"}</b></div>
      </div>
      <div className="mt-4 flex gap-2"><Input type="number" placeholder="Contribution FCFA" value={amt} onChange={(e) => setAmt(e.target.value)} className="h-10 rounded-xl" /><Button variant="soft" onClick={contribute}>Ajouter</Button></div>
    </div>
  );
}

function GoalDialog() {
  const inv = useInvalidate();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", target: 0, saved: 0, target_date: "", priority: "moyenne" });
  const save = async () => {
    if (!f.name || !(f.target > 0)) return toast.error("Nom et montant cible requis");
    const { error } = await supabase.from("goals").insert({ ...f, target_date: f.target_date || null });
    if (error) return toast.error(error.message);
    await inv("goals"); setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="hero"><Plus />Nouvel objectif</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>Nouvel objectif</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nom</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1.5 rounded-xl" />
            <div className="mt-2 flex flex-wrap gap-1.5">{EXAMPLES.map((e) => <button key={e} onClick={() => setF({ ...f, name: e })} className="rounded-full bg-muted px-2.5 py-1 text-xs">{e}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Montant cible</Label><Input type="number" value={f.target || ""} onChange={(e) => setF({ ...f, target: +e.target.value })} className="mt-1.5 rounded-xl" /></div>
            <div><Label>Déjà économisé</Label><Input type="number" value={f.saved || ""} onChange={(e) => setF({ ...f, saved: +e.target.value })} className="mt-1.5 rounded-xl" /></div>
            <div><Label>Date souhaitée</Label><Input type="date" value={f.target_date} onChange={(e) => setF({ ...f, target_date: e.target.value })} className="mt-1.5 rounded-xl" /></div>
            <div><Label>Priorité</Label><Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v })}><SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="haute">Haute</SelectItem><SelectItem value="moyenne">Moyenne</SelectItem><SelectItem value="basse">Basse</SelectItem></SelectContent></Select></div>
          </div>
        </div>
        <Button variant="hero" onClick={save}>Créer l'objectif</Button>
      </DialogContent>
    </Dialog>
  );
}
