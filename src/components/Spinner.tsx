import { cn } from "@/lib/utils";

export function Spinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-10 w-10 border-[3px]" : "h-6 w-6 border-2";
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn("inline-block animate-spin rounded-full border-primary border-t-transparent", s, className)}
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner size="lg" />
    </div>
  );
}
