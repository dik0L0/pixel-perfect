import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, useFinance, useInvalidate } from "@/lib/data";
import { ALERT_TYPES, FIXED_CHARGES, type Profile } from "@/lib/finance";
import { PageHeader, Panel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — DOLA" }, { name: "description", content: "Profil, préférences et sécurité." }] }),
  component: Page,
});

function Page() {
  const { profile, txs, budgets, goals } = useFinance();
  const inv = useInvalidate();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [s, setS] = useState<Profile>(profile);
  const [pw, setPw] = useState({ cur: "", next: "" });
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  const save = async () => {
    const { first_name, last_name, employment, salary, secondary_income, other_income, payday, fixed_charges, main_goal, alert_threshold, alerts_enabled } = s;
    const { error } = await supabase.from("profiles").update({ first_name, last_name, employment, salary, secondary_income, other_income, payday, fixed_charges, main_goal, alert_threshold, alerts_enabled }).eq("id", profile.id);
    if ($1) { toast.error($2); return; }
    await inv("profile"); toast.success("Paramètres enregistrés");
  };
  const toggleDark = (v: boolean) => { setDark(v); document.documentElement.classList.toggle("dark", v); localStorage.setItem("dola-theme", v ? "dark" : "light"); };
  const changePw = async () => {
    const { error } = await supabase.auth.updateUser({ password: pw.next, current_password: pw.cur } as never);
    if ($1) { toast.error($2); return; }
    setPw({ cur: "", next: "" }); toast.success("Mot de passe modifié");
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile, transactions: txs, budgets, goals }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dola-export.json"; a.click();
  };
  const exportCsv = () => {
    const rows = ["date;type;montant;categorie;description;moyen", ...txs.map((t) => [t.date, t.type, t.amount, t.category, (t.description ?? "").replace(/;/g, ","), t.payment_method].join(";"))];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" })); a.download = "dola-transactions.csv"; a.click();
  };
  const deleteAll = async () => {
    if (!confirm("Supprimer définitivement toutes vos données financières et vous déconnecter ?")) return;
    for (const t of ["transactions", "budgets", "goals", "categories", "notification_reads"] as const) await supabase.from(t).delete().eq("user_id", profile.id);
    await supabase.from("profiles").delete().eq("id", profile.id);
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
  const num = (k: keyof Profile) => <Input type="number" value={String(s[k] ?? 0)} onChange={(e) => setS({ ...s, [k]: +e.target.value })} className="mt-1.5 rounded-xl" />;

  return (
    <>
      <PageHeader title="Paramètres" action={<Button variant="hero" onClick={save}>Enregistrer</Button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Informations personnelles">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prénom</Label><Input value={s.first_name} onChange={(e) => setS({ ...s, first_name: e.target.value })} className="mt-1.5 rounded-xl" /></div>
            <div><Label>Nom</Label><Input value={s.last_name} onChange={(e) => setS({ ...s, last_name: e.target.value })} className="mt-1.5 rounded-xl" /></div>
            <div className="col-span-2"><Label>Email</Label><Input disabled value={profile.email} className="mt-1.5 rounded-xl" /></div>
            <div><Label>Devise</Label><Input disabled value="Franc CFA (XAF)" className="mt-1.5 rounded-xl" /></div>
            <div><Label>Situation</Label><Input value={s.employment ?? ""} onChange={(e) => setS({ ...s, employment: e.target.value })} className="mt-1.5 rounded-xl" /></div>
          </div>
          <label className="mt-4 flex items-center justify-between rounded-xl border p-3 text-sm">Mode sombre<Switch checked={dark} onCheckedChange={toggleDark} /></label>
        </Panel>
        <Panel title="Préférences financières">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Salaire mensuel</Label>{num("salary")}</div>
            <div><Label>Jour de paie</Label>{num("payday")}</div>
            <div><Label>Revenus secondaires</Label>{num("secondary_income")}</div>
            <div><Label>Autres revenus</Label>{num("other_income")}</div>
            {FIXED_CHARGES.map(([k, l]) => <div key={k}><Label>{l}</Label><Input type="number" value={s.fixed_charges?.[k] ?? 0} onChange={(e) => setS({ ...s, fixed_charges: { ...s.fixed_charges, [k]: +e.target.value } })} className="mt-1.5 rounded-xl" /></div>)}
            <div className="col-span-2"><Label>Objectif principal</Label><Input value={s.main_goal ?? ""} onChange={(e) => setS({ ...s, main_goal: e.target.value })} className="mt-1.5 rounded-xl" /></div>
          </div>
        </Panel>
        <Panel title="Notifications">
          <Label>Seuil d'alerte budget : {s.alert_threshold} %</Label>
          <Slider className="mt-3" min={50} max={100} step={5} value={[s.alert_threshold]} onValueChange={([v]) => setS({ ...s, alert_threshold: v ?? 80 })} />
          <div className="mt-4 space-y-2">{Object.entries(ALERT_TYPES).map(([k, l]) => (
            <label key={k} className="flex items-center justify-between text-sm">{l}<Switch checked={s.alerts_enabled?.[k] !== false} onCheckedChange={(v) => setS({ ...s, alerts_enabled: { ...s.alerts_enabled, [k]: v } })} /></label>
          ))}</div>
        </Panel>
        <Panel title="Sécurité">
          <div className="space-y-3">
            <Input type="password" placeholder="Mot de passe actuel" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} className="rounded-xl" />
            <Input type="password" placeholder="Nouveau mot de passe (8+ caractères)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="rounded-xl" />
            <Button variant="outline" onClick={changePw} disabled={pw.next.length < 8}>Changer le mot de passe</Button>
            <p className="text-xs text-muted-foreground">DOLA ne vous demandera jamais votre code PIN Mobile Money ni votre mot de passe bancaire.</p>
          </div>
        </Panel>
        <Panel title="Confidentialité & export">
          <p className="text-sm text-muted-foreground">Vos données ne sont visibles que par vous et ne sont jamais revendues.</p>
          <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv}>Exporter CSV</Button><Button variant="outline" onClick={exportData}>Exporter tout (JSON)</Button></div>
        </Panel>
        <Panel title="Suppression du compte">
          <p className="text-sm text-muted-foreground">Supprime définitivement toutes vos données financières.</p>
          <Button variant="destructive" className="mt-3" onClick={deleteAll}>Supprimer mes données</Button>
        </Panel>
      </div>
    </>
  );
}
