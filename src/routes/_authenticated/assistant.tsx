import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Send } from "lucide-react";
import { askAssistant } from "@/lib/assistant.functions";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/Spinner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "Mon assistant — DOLA" }, { name: "description", content: "Discutez avec votre assistant financier." }] }),
  component: Page,
});

const SUGGESTIONS = ["Où passe mon argent ?", "Combien puis-je économiser ce mois-ci ?", "Pourquoi mes dépenses ont-elles augmenté ?", "Puis-je acheter un ordinateur ?", "Comment réduire mon budget transport ?", "Combien dois-je économiser chaque mois ?"];
type Msg = { role: "user" | "assistant"; content: string };

function Page() {
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next); setInput(""); setLoading(true);
    try {
      const r = await ask({ data: { messages: next } });
      if (!r.available) { setUnavailable(true); setMsgs(msgs); }
      else setMsgs([...next, { role: "assistant", content: r.reply }]);
    } catch { setMsgs([...next, { role: "assistant", content: "Une erreur est survenue. Réessayez." }]); }
    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col lg:h-[calc(100vh-5rem)]">
      <PageHeader title="Mon assistant" subtitle="Les calculs sont faits par DOLA ; l'IA les explique. Elle n'invente aucun montant." />
      {unavailable && <p className="mb-3 rounded-xl bg-warning/10 p-3 text-sm">L'assistant IA n'est pas encore disponible.</p>}
      <div className="card-surface flex-1 overflow-y-auto p-4">
        {!msgs.length && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"><Bot /></span>
            <p className="mt-4 font-semibold">Posez votre question</p>
            <div className="mt-4 flex max-w-lg flex-wrap justify-center gap-2">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted">{s}</button>)}</div>
          </div>
        )}
        <div className="space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
              {m.role === "assistant" ? <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4"><ReactMarkdown>{m.content}</ReactMarkdown></div> : m.content}
            </div>
          ))}
          {loading && <div className="w-16 rounded-2xl bg-muted px-4 py-3 text-sm"><span className="animate-pulse">•••</span></div>}
          <div ref={end} />
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ex. Puis-je acheter un téléphone à 150 000 FCFA ?" className="h-12 rounded-xl" />
        <Button variant="hero" className="h-12 w-12" disabled={loading} aria-label="Envoyer">{loading ? <Spinner size="sm" className="border-primary-foreground border-t-transparent" /> : <Send />}</Button>
      </form>
    </div>
  );
}
