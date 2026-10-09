import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "login" | "signup" } => ({ mode: s["mode"] === "signup" ? "signup" : "login" }),
  head: () => ({
    meta: [
      { title: "Connexion — DOLA" },
      { name: "description", content: "Connectez-vous ou créez votre compte DOLA gratuitement." },
      { property: "og:title", content: "Connexion — DOLA" },
      { property: "og:description", content: "Accédez à votre copilote financier personnel." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ first: "", last: "", email: "", password: "" });
  const signup = mode === "signup";
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard", replace: true }); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { first_name: f.first, last_name: f.last } },
      });
      setLoading(false);
      if ($1) { toast.error($2); return; }
      if (data.session) navigate({ to: "/onboarding" }); else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      setLoading(false);
      if ($1) { toast.error($2); return; }
      navigate({ to: "/dashboard" });
    }
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if ($1) { toast.error($2); return; }
    if (r.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-night p-12 text-night-foreground lg:flex">
        <Logo light />
        <div>
          <h2 className="text-4xl font-bold leading-tight">Suivez votre argent.<br />Préparez votre avenir.</h2>
          <p className="mt-4 max-w-md opacity-75">Suivez chaque franc CFA, anticipez vos fins de mois et atteignez vos objectifs.</p>
        </div>
        <p className="text-xs opacity-50">DOLA ne vous demandera jamais votre code PIN Mobile Money ni votre mot de passe bancaire.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-rise">
          <Logo className="mb-8 lg:hidden" />
          {sent ? (
            <div className="card-surface p-6 text-center">
              <h1 className="text-xl font-bold">Vérifiez votre boîte mail</h1>
              <p className="mt-2 text-sm text-muted-foreground">Un lien de confirmation a été envoyé à {f.email}. Cliquez dessus pour activer votre compte.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{signup ? "Créer mon compte" : "Bon retour 👋"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{signup ? "Gratuit, sans carte bancaire." : "Connectez-vous à votre espace DOLA."}</p>
              <Button variant="outline" className="mt-6 h-11 w-full rounded-xl" onClick={google}>
                <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M21.35 11.1h-9.17v2.92h5.28c-.23 1.4-1.66 4.1-5.28 4.1-3.18 0-5.77-2.63-5.77-5.87s2.59-5.87 5.77-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.43C16.8 3.9 14.7 3 12.18 3 7.1 3 3 7.03 3 12.25S7.1 21.5 12.18 21.5c5.27 0 8.76-3.7 8.76-8.92 0-.6-.06-1.05-.15-1.48z" /></svg>
                Continuer avec Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ou<div className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-4">
                {signup && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Prénom</Label><Input required value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} className="mt-1.5 h-11 rounded-xl" /></div>
                    <div><Label>Nom</Label><Input required value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} className="mt-1.5 h-11 rounded-xl" /></div>
                  </div>
                )}
                <div><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1.5 h-11 rounded-xl" /></div>
                <div>
                  <div className="flex justify-between"><Label>Mot de passe</Label>{!signup && <Link to="/forgot-password" className="text-xs text-primary">Mot de passe oublié ?</Link>}</div>
                  <Input type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
                </div>
                <Button variant="hero" className="h-11 w-full" disabled={loading}>{loading ? "Patientez…" : signup ? "Créer mon compte" : "Se connecter"}</Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {signup ? "Déjà inscrit ? " : "Pas encore de compte ? "}
                <Link to="/auth" search={{ mode: signup ? "login" : "signup" }} className="font-semibold text-primary">{signup ? "Se connecter" : "Créer un compte"}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
