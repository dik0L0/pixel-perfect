import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-display text-lg font-bold tracking-tight", light ? "text-night-foreground" : "text-foreground", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">D</span>
      DOLA
    </Link>
  );
}
