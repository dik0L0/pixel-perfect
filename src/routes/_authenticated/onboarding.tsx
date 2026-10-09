import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { profileQuery, supabase, useInvalidate } from "@/lib/data";
import { FIXED_CHARGES, fcfa, initialBudget, monthKey, type Profile } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Configuration — DOLA" }, { name: "description", content: "Configurez votre profil financier." }] }),
  component: Onboarding,
});

const GOALS = ["Mieux gérer mes dépenses", "Économiser de l'argent", "Éviter les fins de mois difficiles", "Préparer un achat important", "Constituer une épargne d'urgence"];
const JOBS = ["Salarié(e)", "Fonctionnaire", "Indépendant(e)", "Commerçant(e)", "Étudiant(e)", "Sans emploi", "Retraité(e)"];
const FREQ = ["mensuel", "hebdomadaire", "irrégulier"];
const STEPS = ["Profil", "Revenus", "Charges fixes", "Objectif", "Budget"];

function Onboarding() {
  const { data: p } = useSuspenseQuery(profileQuery);
  const navigate = useNavigate();
  const inv = useInvalidate();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<Profile>({ ...p, fixed_charges: p.fixed_charges ?? {} });
  const set = (patch: Partial<Profile>) => setS({ ...s, ...patch });
  const plan = initialBudget(s);

  const finish = async () => {
    const { email: _e, plan: _p, ...rest } = s as Profile & { email?: string };
    void _e; void _p;
    const { error } = await supabase.from("profiles").update({ ...rest, onboarded: true }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    const month = monthKey(new Date());
    if (plan.budgets.length) await supabase.from("budgets").upsert(plan.budgets.map((b) => ({ ...b, month, user_id: p.id })), { onConflict: "user_id,month,category" });
    await inv("profile", "budgets");
    toast.success("Votre budget est prêt !");
    navigate({ to: "/dashboard" });
  };
  const money = (k: keyof Profile) => (
    <Input type="number" min={0} inputMode="numeric" value={String(s[k] ?? 0)} onChange={(e) => set({ [k]: Number(e.target.value) } as Partial<Profile>)} className="mt-1.5 h-11 rounded-xl" />
  );

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <Logo />
      <div className="mt-8 flex gap-1.5">{STEPS.map((l, i) => <div key={l} className={cn("h-1.5 flex-1 rounded-full bg-muted", i <= step && "bg-primary")} />)}</div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">Étape {step + 1} sur 5 · {STEPS[step]}</p>

      <div key={step} className="card-surface mt-5 space-y-4 p-6 animate-rise">
        {step === 0 && (<>
          <h1 className="text-2xl font-bold">Faisons connaissance</h1>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prénom</Label><Input value={s.first_name} onChange={(e) => set({ first_name: e.target.value })} className="mt-1.5 h-11 rounded-xl" /></div>
            <div><Label>Nom</Label><Input value={s.last_name} onChange={(e) => set({ last_name: e.target.value })} className="mt-1.5 h-11 rounded-xl" /></div>
          </div>
          <div><Label>Situation professionnelle</Label>
            <div className="mt-2 flex flex-wrap gap-2">{JOBS.map((j) => <Chip key={j} on={s.employment === j} onClick={() => set({ employment: j })}>{j}</Chip>)}</div></div>
          <div><Label>Fréquence des revenus</Label>
            <div className="mt-2 flex gap-2">{FREQ.map((j) => <Chip key={j} on={s.income_frequency === j} onClick={() => set({ income_frequency: j })}>{j}</Chip>)}</div></div>
        </>)}
        {step === 1 && (<>
          <h1 className="text-2xl font-bold">Vos revenus mensuels</h1>
          <div><Label>Salaire mensuel (FCFA)</Label>{money("salary")}</div>
          <div><Label>Revenus secondaires</Label>{money("secondary_income")}</div>
          <div><Label>Autres revenus</Label>{money("other_income")}</div>
          <div><Label>Jour habituel de réception du salaire</Label><Input type="number" min={1} max={31} value={s.payday} onChange={(e) => set({ payday: Math.min(31, Math.max(1, Number(e.target.value))) })} className="mt-1.5 h-11 rounded-xl" /></div>
        </>)}
        {step === 2 && (<>
          <h1 className="text-2xl font-bold">Vos charges fixes</h1>
          <div className="grid grid-cols-2 gap-3">
            {FIXED_CHARGES.map(([k, l]) => (
              <div key={k}><Label>{l}</Label><Input type="number" min={0} value={s.fixed_charges[k] ?? 0} onChange={(e) => set({ fixed_charges: { ...s.fixed_charges, [k]: Number(e.target.value) } })} className="mt-1.5 h-11 rounded-xl" /></div>
            ))}
          </div>
        </>)}
        {step === 3 && (<>
          <h1 className="text-2xl font-bold">Quel est votre principal objectif financier ?</h1>
          <div className="space-y-2">{GOALS.map((g) => (
            <button key={g} onClick={() => set({ main_goal: g })} className={cn("flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition", s.main_goal === g && "border-primary bg-primary/5")}>
              {g}{s.main_goal === g && <Check className="h-4 w-4 text-primary" />}
            </button>))}</div>
        </>)}
        {step === 4 && (<>
          <h1 className="text-2xl font-bold">Votre premier budget prévisionnel</h1>
          <p className="text-sm text-muted-foreground">Calculé à partir de vos revenus ({fcfa(s.salary + s.secondary_income + s.other_income)}) et charges. Modifiable à tout moment.</p>
          <div className="divide-y rounded-xl border">
            {plan.budgets.map((b) => <div key={b.category} className="flex justify-between p-3 text-sm"><span>{b.category}</span><span className="font-semibold">{fcfa(b.amount)}</span></div>)}
            <div className="flex justify-between bg-success/10 p-3 text-sm font-semibold text-success"><span>Épargne prévue (10 %)</span><span>{fcfa(plan.saving)}</span></div>
          </div>
        </>)}
      </div>
      <div className="mt-5 flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Retour</Button>
        {step < 4 ? <Button variant="hero" className="px-6" onClick={() => setStep(step + 1)}>Continuer</Button> : <Button variant="hero" className="px-6" onClick={finish}>Accéder à mon tableau de bord</Button>}
      </div>
    </div>
  );
}

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-sm capitalize transition", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>{children}</button>;
}
