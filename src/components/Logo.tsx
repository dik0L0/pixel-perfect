import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/dola-logo.png.asset.json";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center", className)}>
      <img
        src={logoAsset.url}
        alt="DOLA — Suivez votre argent."
        className={cn("h-9 w-auto rounded-md", light && "brightness-0 invert")}
      />
    </Link>
  );
}
