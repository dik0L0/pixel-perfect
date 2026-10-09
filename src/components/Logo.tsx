import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo-wordmark.png";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center", className)}>
      <img
        src={logoImg}
        alt="DOLA — Suivez votre argent."
        width={873}
        height={195}
        className={cn("h-7 w-auto object-contain", light && "brightness-0 invert")}
      />
    </Link>
  );
}
