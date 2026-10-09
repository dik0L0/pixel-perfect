import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { byCategory, computeAlerts, fcfa, forecast, goalStats, inMonth, insights, monthKey, pct, shiftMonth, totals, type Budget, type Goal, type Profile, type Tx } from "./finance";

type Msg = { role: "user" | "assistant"; content: string };

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messages: Msg[] }) => ({ messages: d.messages.slice(-12).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })) as Msg[] }))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { available: false as const, reply: "" };
    const sb = context.supabase;
    const [p, t, b, g] = await Promise.all([
      sb.from("profiles").select("*").eq("id", context.userId).single(),
      sb.from("transactions").select("*").limit(5000),
      sb.from("budgets").select("*"),
      sb.from("goals").select("*"),
    ]);
    const profile = p.data as unknown as Profile;
    for (const k of ["salary", "secondary_income", "other_income"] as const) profile[k] = Number(profile[k]);
    const txs = (t.data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as unknown as Tx[];
    const budgets = (b.data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Budget[];
    const goals = (g.data ?? []).map((r) => ({ ...r, target: Number(r.target), saved: Number(r.saved) })) as Goal[];
    const m = monthKey(new Date());
    const cur = totals(inMonth(txs, m)), prev = totals(inMonth(txs, shiftMonth(m, -1)));
    const f = forecast(txs, profile);
    const spent = new Map(byCategory(inMonth(txs, m)).map((c) => [c.name, c.value]));
    const facts = [
      `Date : ${new Date().toLocaleDateString("fr-FR")}`,
      `Mois en cours : revenus ${fcfa(cur.income)}, dépenses ${fcfa(cur.expense)}, solde ${fcfa(cur.net)}, taux d'épargne ${pct(cur.savingsRate)}.`,
      `Mois précédent : revenus ${fcfa(prev.income)}, dépenses ${fcfa(prev.expense)}, solde ${fcfa(prev.net)}.`,
      `Dépenses par catégorie ce mois : ${byCategory(inMonth(txs, m)).map((c) => `${c.name} ${fcfa(c.value)}`).join(", ") || "aucune"}.`,
      `Mois précédent par catégorie : ${byCategory(inMonth(txs, shiftMonth(m, -1))).map((c) => `${c.name} ${fcfa(c.value)}`).join(", ") || "aucune"}.`,
      `Budgets du mois : ${budgets.filter((x) => x.month === m).map((x) => `${x.category} ${fcfa(spent.get(x.category) ?? 0)}/${fcfa(x.amount)}`).join(", ") || "aucun"}.`,
      `Revenus attendus mensuels : ${fcfa(profile.salary + profile.secondary_income + profile.other_income)}. Paie le ${profile.payday} du mois.`,
      `Charges fixes : ${Object.entries(profile.fixed_charges ?? {}).filter(([, v]) => Number(v) > 0).map(([k, v]) => `${k} ${fcfa(Number(v))}`).join(", ") || "aucune"}.`,
      `Prévision : dépense moyenne ${fcfa(f.avg)}/jour, solde fin de mois optimiste ${fcfa(f.endMonth.optimiste)}, réaliste ${fcfa(f.endMonth.realiste)}, prudent ${fcfa(f.endMonth.prudent)}, jours avant épuisement ${f.daysLeft ?? "n/a"}, capacité d'épargne ${fcfa(f.savingsCapacity)}/mois.`,
      `Objectifs : ${goals.map((x) => { const s = goalStats(x); return `${x.name} ${fcfa(x.saved)}/${fcfa(x.target)}, ${s.monthly === null ? "sans date" : `${fcfa(s.monthly)}/mois nécessaires`}`; }).join("; ") || "aucun"}.`,
      `Analyses : ${insights(txs).join(" ")}`,
      `Alertes : ${computeAlerts(txs, budgets, goals, profile).map((a) => a.message).join(" ")}`,
    ].join("\n");
    const system = `Tu es l'assistant financier de DOLA (Gabon, Franc CFA). Réponds en français, de façon concise, bienveillante et concrète.
RÈGLES STRICTES : n'utilise QUE les chiffres des FAITS ci-dessous, calculés par le moteur DOLA. N'invente jamais de montant. Si une donnée manque, dis-le. Présente les prévisions comme des estimations. Ne demande jamais de code PIN ni de mot de passe bancaire.
FAITS DE L'UTILISATEUR :\n${facts}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "system", content: system }, ...data.messages] }),
    });
    if (res.status === 429) return { available: true as const, reply: "Trop de demandes pour le moment, réessayez dans un instant." };
    if (res.status === 402) return { available: true as const, reply: "Le service d'assistant est temporairement indisponible (crédits épuisés)." };
    if (!res.ok) { console.error("AI error", res.status, await res.text()); return { available: true as const, reply: "L'assistant n'a pas pu répondre. Réessayez." }; }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { available: true as const, reply: json.choices?.[0]?.message?.content ?? "" };
  });
