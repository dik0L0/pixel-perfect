// Moteur financier déterministe de DOLA. Toutes les valeurs affichées
// (et transmises à l'assistant IA) proviennent de ces fonctions.

export type TxType = "revenu" | "depense";
export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string | null;
  payment_method: string;
  exceptional: boolean;
}
export interface Budget { id: string; month: string; category: string; amount: number }
export interface Goal { id: string; name: string; target: number; saved: number; target_date: string | null; priority: string }
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  employment: string | null;
  income_frequency: string | null;
  salary: number;
  secondary_income: number;
  other_income: number;
  payday: number;
  fixed_charges: Record<string, number>;
  main_goal: string | null;
  onboarded: boolean;
  plan: string;
  alert_threshold: number;
  alerts_enabled: Record<string, boolean>;
}

export const EXPENSE_CATEGORIES = [
  "Alimentation", "Logement", "Transport", "Santé", "Éducation", "Communication",
  "Loisirs", "Famille", "Shopping", "Abonnements", "Autres",
];
export const INCOME_CATEGORIES = ["Salaire", "Revenu secondaire", "Remboursement", "Autres revenus"];
export const PAYMENT_METHODS = ["Espèces", "Airtel Money", "Moov Money", "Carte bancaire", "Virement bancaire", "Autre"];
export const FIXED_CHARGES = [
  ["loyer", "Loyer", "Logement"], ["electricite", "Électricité", "Logement"], ["eau", "Eau", "Logement"],
  ["internet", "Internet", "Communication"], ["transport", "Transport", "Transport"],
  ["scolarite", "Scolarité", "Éducation"], ["abonnements", "Abonnements", "Abonnements"], ["autres", "Autres charges", "Autres"],
] as const;

const fmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
export const fcfa = (n: number) => `${fmt.format(Math.round(n))} FCFA`;
export const pct = (n: number | null) => (n === null || !isFinite(n) ? "—" : `${n.toFixed(0)} %`);

export const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const monthKey = (d: Date | string) => (typeof d === "string" ? d.slice(0, 7) : toISO(d).slice(0, 7));
export const shiftMonth = (key: string, delta: number) => {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
};
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
};
const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/**
 * Règles explicites :
 * - Un revenu catégorisé « Remboursement » réduit les dépenses au lieu de gonfler les revenus.
 * - Les transactions « exceptionnelles » comptent dans les totaux mais sont exclues des moyennes
 *   utilisées pour les prévisions.
 * - Revenus nuls : les taux (épargne, consommation) sont « non calculables » (null).
 */
export function totals(txs: Tx[]) {
  let income = 0, expense = 0, refunds = 0;
  for (const t of txs) {
    if (t.type === "depense") expense += t.amount;
    else if (t.category === "Remboursement") refunds += t.amount;
    else income += t.amount;
  }
  expense = Math.max(0, expense - refunds);
  const net = income - expense;
  return {
    income, expense, net,
    savingsRate: income > 0 ? (net / income) * 100 : null,
    consumptionRate: income > 0 ? (expense / income) * 100 : null,
  };
}

export const inMonth = (txs: Tx[], key: string) => txs.filter((t) => t.date.startsWith(key));

export function byCategory(txs: Tx[]) {
  const map = new Map<string, number>();
  for (const t of txs) if (t.type === "depense") map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function monthlySeries(txs: Tx[], months: number, end = monthKey(new Date())) {
  const out = [];
  let cumul = 0;
  for (let i = months - 1; i >= 0; i--) {
    const k = shiftMonth(end, -i);
    const t = totals(inMonth(txs, k));
    cumul += t.net;
    out.push({ month: k, label: monthLabel(k), revenus: t.income, depenses: t.expense, epargne: t.net, solde: cumul });
  }
  return out;
}

export const variation = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100);

/** Moyenne mobile des dépenses quotidiennes (30 derniers jours, hors exceptionnelles). */
export function dailyAverage(txs: Tx[], today = new Date()) {
  const from = new Date(today); from.setDate(from.getDate() - 30);
  const fromIso = toISO(from), todayIso = toISO(today);
  const recent = txs.filter((t) => t.type === "depense" && !t.exceptional && t.date > fromIso && t.date <= todayIso);
  const earliest = txs.reduce((m, t) => (t.date < m ? t.date : m), todayIso);
  const span = Math.max(1, Math.min(30, Math.round((+today - +new Date(earliest)) / 86400000) + 1));
  return recent.reduce((s, t) => s + t.amount, 0) / span;
}

export function nextPayday(payday: number, today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth(), Math.min(payday, daysInMonth(today)));
  if (d <= today) {
    const n = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return new Date(n.getFullYear(), n.getMonth(), Math.min(payday, daysInMonth(n)));
  }
  return d;
}

export const expectedIncome = (p: Profile) => Number(p.salary) + Number(p.secondary_income) + Number(p.other_income);
export const fixedTotal = (p: Profile) => Object.values(p.fixed_charges ?? {}).reduce((s, v) => s + Number(v || 0), 0);

export const SCENARIOS = { optimiste: 0.85, realiste: 1, prudent: 1.2 } as const;

/** Prévision du solde jour par jour jusqu'à la prochaine paie (3 scénarios). */
export function forecast(txs: Tx[], p: Profile, today = new Date()) {
  const month = monthKey(today);
  const balance = totals(inMonth(txs, month)).net;
  const avg = dailyAverage(txs, today);
  const pay = nextPayday(p.payday, today);
  const horizon = Math.max(1, Math.round((+pay - +today) / 86400000));
  const endOfMonth = daysInMonth(today) - today.getDate();
  const points = [];
  for (let d = 0; d <= horizon; d++) {
    const date = new Date(today); date.setDate(date.getDate() + d);
    points.push({
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      optimiste: Math.round(balance - avg * SCENARIOS.optimiste * d),
      realiste: Math.round(balance - avg * d),
      prudent: Math.round(balance - avg * SCENARIOS.prudent * d),
    });
  }
  const daysLeft = avg > 0 ? Math.floor(balance / avg) : null;
  const endMonth = {
    optimiste: balance - avg * SCENARIOS.optimiste * endOfMonth,
    realiste: balance - avg * endOfMonth,
    prudent: balance - avg * SCENARIOS.prudent * endOfMonth,
  };
  const income = expectedIncome(p);
  const capacity = income - fixedTotal(p) - avg * 30;
  return {
    balance, avg, pay, horizon, points, daysLeft, endMonth,
    savingsCapacity: Math.max(0, capacity),
    hypotheses: [
      `Solde du mois en cours : ${fcfa(balance)} (revenus − dépenses enregistrés ce mois).`,
      `Dépense quotidienne moyenne sur 30 jours, hors transactions exceptionnelles : ${fcfa(avg)}.`,
      `Prochaine paie attendue le ${pay.toLocaleDateString("fr-FR")} (${horizon} jours).`,
      `Scénarios : optimiste −15 %, réaliste = moyenne, prudent +20 % de dépenses.`,
    ],
  };
}

/** Prévision des dépenses par catégorie pour le mois en cours. */
export function categoryForecast(txs: Tx[], today = new Date()) {
  const month = monthKey(today);
  const ratio = daysInMonth(today) / today.getDate();
  return byCategory(inMonth(txs, month).filter((t) => !t.exceptional)).map((c) => ({ ...c, projected: Math.round(c.value * ratio) }));
}

export function simulatePurchase(txs: Tx[], p: Profile, amount: number, date: Date, today = new Date()) {
  const f = forecast(txs, p, today);
  const days = Math.max(0, Math.round((+date - +today) / 86400000));
  const before = f.balance - f.avg * days;
  const after = before - amount;
  const endAfter = f.endMonth.realiste - amount;
  const fixed = fixedTotal(p);
  const plannedSaving = Math.max(0, expectedIncome(p) * 0.1);
  let risk: "faible" | "modéré" | "élevé" = "faible";
  if (endAfter < 0) risk = "élevé";
  else if (endAfter < plannedSaving) risk = "modéré";
  const compatible = risk === "faible";
  const savingsImpact = Math.min(plannedSaving, Math.max(0, plannedSaving - endAfter));
  const suggested = compatible ? null : f.pay;
  return { before, after, endAfter, fixed, savingsImpact, risk, compatible, suggested, forecast: f };
}

export function goalStats(g: Goal, today = new Date()) {
  const remaining = Math.max(0, g.target - g.saved);
  const progress = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
  let monthsLeft: number | null = null;
  if (g.target_date) {
    const t = new Date(g.target_date);
    monthsLeft = Math.max(0, (t.getFullYear() - today.getFullYear()) * 12 + t.getMonth() - today.getMonth());
  }
  const monthly = monthsLeft === null ? null : remaining / Math.max(1, monthsLeft);
  return { remaining, progress, monthsLeft, monthly };
}

export function goalEta(g: Goal, monthlyCapacity: number, today = new Date()) {
  const remaining = Math.max(0, g.target - g.saved);
  if (remaining === 0) return today;
  if (monthlyCapacity <= 0) return null;
  const d = new Date(today); d.setMonth(d.getMonth() + Math.ceil(remaining / monthlyCapacity));
  return d;
}

export type AlertLevel = "danger" | "warning" | "info" | "success";
export interface FinAlert { key: string; type: string; level: AlertLevel; title: string; message: string }

export const ALERT_TYPES: Record<string, string> = {
  depassement: "Dépassement budgétaire",
  presque: "Budget presque épuisé",
  facture: "Facture imminente",
  solde: "Solde prévisionnel insuffisant",
  objectif: "Objectif d'épargne en retard",
  inhabituel: "Dépenses inhabituelles",
  hebdo: "Résumé hebdomadaire",
  mensuel: "Résumé mensuel",
};

export function computeAlerts(txs: Tx[], budgets: Budget[], goals: Goal[], p: Profile, today = new Date()): FinAlert[] {
  const out: FinAlert[] = [];
  const month = monthKey(today);
  const spent = new Map(byCategory(inMonth(txs, month)).map((c) => [c.name, c.value]));
  const th = p.alert_threshold ?? 80;
  for (const b of budgets.filter((b) => b.month === month && b.amount > 0)) {
    const used = ((spent.get(b.category) ?? 0) / b.amount) * 100;
    if (used >= 100) out.push({ key: `dep-${month}-${b.category}`, type: "depassement", level: "danger", title: `Budget ${b.category} dépassé`, message: `Vous avez utilisé ${used.toFixed(0)} % de votre budget ${b.category.toLowerCase()} (${fcfa(spent.get(b.category) ?? 0)} / ${fcfa(b.amount)}).` });
    else if (used >= th) out.push({ key: `pre-${month}-${b.category}-${th}`, type: "presque", level: "warning", title: `Budget ${b.category} presque épuisé`, message: `Attention : vous avez déjà utilisé ${used.toFixed(0)} % de votre budget ${b.category.toLowerCase()}.` });
  }
  const f = forecast(txs, p, today);
  if (f.endMonth.realiste < 0) out.push({ key: `solde-${toISO(today)}`, type: "solde", level: "danger", title: "Solde prévisionnel insuffisant", message: `À votre rythme actuel, votre solde pourrait atteindre ${fcfa(f.endMonth.realiste)} en fin de mois (estimation).` });
  const fixed = fixedTotal(p);
  const dom = today.getDate();
  if (fixed > 0 && dom >= 26) out.push({ key: `fact-${month}`, type: "facture", level: "info", title: "Charges fixes à venir", message: `Vos charges fixes (${fcfa(fixed)}) arrivent en début de mois prochain.` });
  for (const g of goals) {
    const s = goalStats(g, today);
    if (g.target_date && s.remaining > 0 && (s.monthsLeft === 0 || (s.monthly ?? 0) > f.savingsCapacity))
      out.push({ key: `obj-${g.id}-${month}`, type: "objectif", level: "warning", title: `Objectif « ${g.name} » en retard`, message: `Il faudrait épargner ${fcfa(s.monthly ?? s.remaining)} par mois, au-delà de votre capacité estimée (${fcfa(f.savingsCapacity)}).` });
  }
  const from = new Date(today); from.setDate(from.getDate() - 90);
  const hist = txs.filter((t) => t.type === "depense" && t.date >= toISO(from));
  const week = new Date(today); week.setDate(week.getDate() - 7);
  for (const t of hist.filter((t) => t.date >= toISO(week))) {
    const same = hist.filter((h) => h.category === t.category && h.id !== t.id);
    if (same.length < 3) continue;
    const avg = same.reduce((s, h) => s + h.amount, 0) / same.length;
    if (t.amount > avg * 3) out.push({ key: `inh-${t.id}`, type: "inhabituel", level: "warning", title: "Dépense inhabituelle", message: `${fcfa(t.amount)} en ${t.category.toLowerCase()} le ${new Date(t.date).toLocaleDateString("fr-FR")}, soit plus de 3× votre moyenne.` });
  }
  const wk = totals(txs.filter((t) => t.date >= toISO(week)));
  out.push({ key: `hebdo-${toISO(week).slice(0, 10)}`, type: "hebdo", level: "info", title: "Résumé hebdomadaire", message: `7 derniers jours : ${fcfa(wk.income)} de revenus, ${fcfa(wk.expense)} de dépenses.` });
  const prev = shiftMonth(month, -1);
  const pm = totals(inMonth(txs, prev));
  if (pm.income || pm.expense) out.push({ key: `mens-${prev}`, type: "mensuel", level: pm.net >= 0 ? "success" : "warning", title: `Résumé de ${monthLabel(prev)}`, message: `Revenus ${fcfa(pm.income)}, dépenses ${fcfa(pm.expense)}, épargne nette ${fcfa(pm.net)}.` });
  return out.filter((a) => p.alerts_enabled?.[a.type] !== false);
}

/** Analyses automatiques comparant le mois en cours au précédent. */
export function insights(txs: Tx[], today = new Date()) {
  const cur = monthKey(today), prev = shiftMonth(cur, -1);
  const a = new Map(byCategory(inMonth(txs, cur)).map((c) => [c.name, c.value]));
  const b = new Map(byCategory(inMonth(txs, prev)).map((c) => [c.name, c.value]));
  const out: string[] = [];
  for (const [cat, v] of a) {
    const p = b.get(cat);
    if (p && p > 0) {
      const d = ((v - p) / p) * 100;
      if (Math.abs(d) >= 10) out.push(`Vos dépenses « ${cat} » ont ${d > 0 ? "augmenté" : "baissé"} de ${Math.abs(d).toFixed(0)} % ce mois-ci.`);
    }
  }
  const tc = totals(inMonth(txs, cur)), tp = totals(inMonth(txs, prev));
  if (tp.income || tp.expense) {
    const diff = tc.net - tp.net;
    out.push(diff >= 0 ? `Vous avez économisé ${fcfa(diff)} de plus que le mois précédent.` : `Votre épargne nette est inférieure de ${fcfa(-diff)} au mois précédent.`);
  }
  return out.slice(0, 5);
}

export function recommendations(txs: Tx[], budgets: Budget[], p: Profile, today = new Date()) {
  const out: string[] = [];
  const cur = totals(inMonth(txs, monthKey(today)));
  const top = byCategory(inMonth(txs, monthKey(today)))[0];
  if (cur.savingsRate !== null && cur.savingsRate < 10) out.push("Visez un taux d'épargne d'au moins 10 % : programmez une contribution à un objectif dès réception du salaire.");
  if (top && cur.expense > 0 && top.value / cur.expense > 0.35) out.push(`« ${top.name} » représente ${((top.value / cur.expense) * 100).toFixed(0)} % de vos dépenses : fixez-lui un budget dédié.`);
  if (!budgets.some((b) => b.month === monthKey(today))) out.push("Vous n'avez pas encore défini de budget ce mois-ci. Copiez ceux du mois précédent en un clic.");
  if (expectedIncome(p) > 0 && fixedTotal(p) / expectedIncome(p) > 0.5) out.push("Vos charges fixes dépassent 50 % de vos revenus : identifiez un abonnement ou un poste à renégocier.");
  if (!out.length) out.push("Belle gestion ! Continuez à enregistrer vos dépenses pour des prévisions plus précises.");
  return out;
}

export function initialBudget(p: Profile) {
  const income = expectedIncome(p);
  const fixedByCat: Record<string, number> = {};
  for (const [key, , cat] of FIXED_CHARGES) fixedByCat[cat] = (fixedByCat[cat] ?? 0) + Number(p.fixed_charges?.[key] ?? 0);
  const saving = Math.round(income * 0.1);
  const variable = Math.max(0, income - fixedTotal(p) - saving);
  const split: Record<string, number> = { Alimentation: 0.4, Transport: 0.15, Santé: 0.08, Communication: 0.07, Loisirs: 0.1, Famille: 0.1, Shopping: 0.1 };
  const res: Record<string, number> = { ...fixedByCat };
  for (const [c, r] of Object.entries(split)) res[c] = (res[c] ?? 0) + Math.round((variable * r) / 1000) * 1000;
  return { budgets: Object.entries(res).filter(([, v]) => v > 0).map(([category, amount]) => ({ category, amount })), saving };
}

export function budgetColor(used: number) {
  return used > 90 ? "destructive" : used >= 70 ? "warning" : "success";
}
