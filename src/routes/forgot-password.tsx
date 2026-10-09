import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — DOLA" },
      { name: "description", content: "Réinitialisez le mot de passe de votre compte DOLA." },
      { property: "og:title", content: "Mot de passe oublié — DOLA" },
      { property: "og:description", content: "Recevez un lien de réinitialisation par email." },
    ],
  }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card-surface w-full max-w-sm p-6 animate-rise">
        <Logo className="mb-6" />
        <h1 className="text-xl font-bold">Mot de passe oublié</h1>
        {sent ? <p className="mt-3 text-sm text-muted-foreground">Si un compte existe pour {email}, un lien de réinitialisation vient d'être envoyé.</p> : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Input type="email" required placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
            <Button variant="hero" className="h-11 w-full" disabled={loading}>{loading ? <><Spinner size="sm" className="border-primary-foreground border-t-transparent" />Envoi…</> : "Envoyer le lien"}</Button>
          </form>
        )}
        <Link to="/auth" search={{ mode: "login" }} className="mt-4 block text-sm text-primary">← Retour à la connexion</Link>
      </div>
    </div>
  );
}
