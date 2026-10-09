import { createFileRoute, Link, Navigate, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { Suspense } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, ArrowLeftRight, PieChart, BarChart3, TrendingUp, Calculator, Target, Bell, Bot, Settings, LogOut, MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { TxDialog } from "@/components/TxDialog";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", short: "Accueil", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", short: "Opérations", icon: ArrowLeftRight },
  { to: "/budgets", label: "Mes budgets", short: "Budgets", icon: PieChart },
  { to: "/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/previsions", label: "Prévisions", icon: TrendingUp },
  { to: "/simulations", label: "Simulations", icon: Calculator },
  { to: "/objectifs", label: "Mes objectifs", short: "Objectifs", icon: Target },
  { to: "/alertes", label: "Alertes", icon: Bell },
  { to: "/assistant", label: "Mon assistant", icon: Bot },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;
const MOBILE = ["/dashboard", "/transactions", "/budgets", "/objectifs"];

import { FullPageLoader as Loading } from "@/components/Spinner";

function Layout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/onboarding")) return <Suspense fallback={<Loading />}><Outlet /></Suspense>;
  return (
    <Suspense fallback={<Loading />}>
      <Shell path={path} />
    </Suspense>
  );
}

function Shell({ path }: { path: string }) {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (!profile.onboarded) return <Navigate to="/onboarding" replace />;
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <Logo light className="px-2 py-3" />
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent", path === to && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Icon className={cn("h-4 w-4", path === to && "text-sidebar-primary")} />{label}
            </Link>
          ))}
        </nav>
        <div className="mb-3 flex justify-end px-1"><ThemeToggle className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground" /></div>
        <div className="rounded-xl bg-sidebar-accent p-3 text-xs">
          <p className="font-semibold text-sidebar-accent-foreground">{profile.first_name} {profile.last_name}</p>
          <p className="truncate opacity-70">{profile.email}</p>
          <button onClick={signOut} className="mt-2 flex items-center gap-2 opacity-80 hover:opacity-100"><LogOut className="h-3.5 w-3.5" />Déconnexion</button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle className="border-0 bg-transparent" />
          <Link to="/alertes" className="rounded-full p-2 hover:bg-muted" aria-label="Alertes"><Bell className="h-5 w-5" /></Link>
        </div>
      </header>

      <main className="pb-24 lg:pb-10 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
          <Suspense fallback={<Loading />}><Outlet /></Suspense>
        </div>
      </main>

      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <TxDialog trigger={<button aria-label="Ajouter une transaction" className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="h-6 w-6" /></button>} />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.filter((n) => MOBILE.includes(n.to)).map((n) => { const { to, label, icon: Icon } = n; const short = "short" in n ? n.short : undefined; return (
          <Link key={to} to={to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground", path === to && "text-primary")}>
            <Icon className="h-5 w-5" />{short ?? label}
          </Link>
        ); })}
        <Sheet>
          <SheetTrigger className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" />Plus
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetTitle className="mb-3">Menu</SheetTitle>
            <div className="grid grid-cols-3 gap-2">
              {NAV.filter((n) => !MOBILE.includes(n.to)).map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-3 text-center text-xs font-medium"><Icon className="h-5 w-5 text-primary" />{label}</Link>
              ))}
              <button onClick={signOut} className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-3 text-xs font-medium"><LogOut className="h-5 w-5 text-destructive" />Déconnexion</button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
