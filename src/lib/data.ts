import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Budget, Goal, Profile, Tx } from "./finance";

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Non connecté");
  return data.user.id;
}
const num = <T extends Record<string, unknown>>(rows: T[], keys: (keyof T)[]) =>
  rows.map((r) => { const o = { ...r }; for (const k of keys) (o as Record<string, unknown>)[k as string] = Number(r[k]); return o; });

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async (): Promise<Profile & { email: string }> => {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user!.id;
    let { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (!data) {
      const ins = await supabase.from("profiles").insert({ id }).select("*").single();
      data = ins.data;
    }
    const p = data as unknown as Profile;
    return { ...p, salary: +p.salary, secondary_income: +p.secondary_income, other_income: +p.other_income, email: u.user!.email ?? "" };
  },
});
export const txQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: async (): Promise<Tx[]> => {
    const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(5000);
    if (error) throw error;
    return num(data ?? [], ["amount"]) as unknown as Tx[];
  },
});
export const budgetsQuery = queryOptions({
  queryKey: ["budgets"],
  queryFn: async (): Promise<Budget[]> => {
    const { data, error } = await supabase.from("budgets").select("*");
    if (error) throw error;
    return num(data ?? [], ["amount"]) as unknown as Budget[];
  },
});
export const goalsQuery = queryOptions({
  queryKey: ["goals"],
  queryFn: async (): Promise<Goal[]> => {
    const { data, error } = await supabase.from("goals").select("*").order("created_at");
    if (error) throw error;
    return num(data ?? [], ["target", "saved"]) as unknown as Goal[];
  },
});
export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    return data ?? [];
  },
});
export const readsQuery = queryOptions({
  queryKey: ["reads"],
  queryFn: async () => {
    const { data } = await supabase.from("notification_reads").select("key");
    return new Set((data ?? []).map((r) => r.key));
  },
});

export function useFinance() {
  const profile = useSuspenseQuery(profileQuery).data;
  const txs = useSuspenseQuery(txQuery).data;
  const budgets = useSuspenseQuery(budgetsQuery).data;
  const goals = useSuspenseQuery(goalsQuery).data;
  return { profile, txs, budgets, goals };
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export { supabase, uid };
