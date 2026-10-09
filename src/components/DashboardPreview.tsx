import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import { TrendingUp, Wallet, ArrowDownRight, PiggyBank } from "lucide-react";

const data = [
  { m: "Mai", v: 120 }, { m: "Juin", v: 145 }, { m: "Juil.", v: 130 }, { m: "Août", v: 170 }, { m: "Sept.", v: 160 }, { m: "Oct.", v: 210 },
];

export function DashboardPreview() {
  return (
    <div className="card-surface relative overflow-hidden p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">Bonjour, Aïcha 👋</p>
      <p className="font-display text-lg font-semibold">Voici votre situation aujourd'hui</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { l: "Revenus", v: "450 000", i: Wallet, c: "text-primary" },
          { l: "Dépenses", v: "286 500", i: ArrowDownRight, c: "text-destructive" },
          { l: "Solde", v: "163 500", i: TrendingUp, c: "text-success" },
          { l: "Épargne", v: "45 000", i: PiggyBank, c: "text-warning" },
        ].map(({ l, v, i: I, c }) => (
          <div key={l} className="rounded-2xl bg-muted p-3">
            <I className={`h-4 w-4 ${c}`} />
            <p className="mt-2 text-xs text-muted-foreground">{l}</p>
            <p className="font-display text-sm font-bold sm:text-base">{v} <span className="text-[10px] font-medium text-muted-foreground">FCFA</span></p>
          </div>
        ))}
      </div>
      <div className="mt-4 h-32">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs><linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
            <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} fill="url(#pv)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
        ⚠️ Vous avez utilisé 85 % de votre budget transport.
      </div>
    </div>
  );
}
