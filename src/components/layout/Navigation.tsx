"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, LayoutDashboard, Loader2, LogOut, Star, TrendingUp } from "lucide-react";
import { UserDisplay } from "@/components/auth/UserDisplay";
import { useTrading } from "@/context/TradingContext";
import { signOut } from "@/lib/auth";
import type { TabId } from "@/lib/types";
import {
  btnTransition,
  pageBg,
  tabActive,
  tabBar,
  tabInactive,
} from "@/lib/ui/classes";
import { cn } from "@/lib/utils";
import { LastUpdatedIndicator } from "./LastUpdatedIndicator";
import { TimeTravelMode } from "./TimeTravelMode";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "portfolio", label: "Portfolio", icon: LayoutDashboard },
  { id: "trade", label: "Trade", icon: TrendingUp },
  { id: "watchlist", label: "Watchlist", icon: Star },
  { id: "history", label: "History", icon: History },
];

export function Navigation() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useTrading();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.replace("/login");
  };

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-700 ${pageBg}/95 backdrop-blur-xl`}>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-100">
                Paper Trading Simulator
              </h1>
              <p className="mt-1 text-sm font-normal text-slate-400">
                Live market data via Finnhub
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <UserDisplay />
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-400 hover:border-slate-600 hover:bg-slate-700/50 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-60",
                    btnTransition,
                  )}
                >
                  {isSigningOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  Sign out
                </button>
              </div>
              <LastUpdatedIndicator />
            </div>
            <TimeTravelMode />
          </div>

          <nav className={tabBar}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium sm:flex-none sm:justify-start",
                  btnTransition,
                  activeTab === id ? tabActive : tabInactive,
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
