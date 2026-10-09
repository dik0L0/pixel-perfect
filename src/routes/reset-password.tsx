import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — MONÉO" },
      { name: "description", content: "Choisissez un nouveau mot de passe MONÉO." },
      { property: "og:title", content: "Nouveau mot de passe — MONÉO" },
      { property: "og:description", content: "Définissez votre nouveau mot de passe." },
    ],
  }),
  component: Page,
});

function Page() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/dashboard" });
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="card-surface w-full max-w-sm space-y-4 p-6">
        <Logo />
        <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
        <Input type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8 caractères minimum" className="h-11 rounded-xl" />
        <Button variant="hero" className="h-11 w-full">Enregistrer</Button>
      </form>
    </div>
  );
}
