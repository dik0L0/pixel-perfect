import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo-concept-1.png";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center", className)}>
      <img
        src={logoImg}
        alt="DOLA — Suivez votre argent."
        width={1024}
        height={1024}
        className={cn("h-10 w-auto object-contain", light && "brightness-0 invert")}
      />
    </Link>
  );
}
