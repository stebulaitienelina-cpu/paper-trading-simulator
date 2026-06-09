"use client";

import { useMemo } from "react";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import {
  computeAchievements,
  countUnlockedAchievements,
} from "@/lib/achievements/computeAchievements";
import {
  btnTransition,
  card,
  cardPadding,
  pillBadge,
  ruleBanner,
  sectionSubtitle,
} from "@/lib/ui/classes";
import { cn } from "@/lib/utils";

export function AchievementsList() {
  const { portfolio, quotes } = useTrading();

  const stockValue = useMemo(
    () =>
      portfolio.positions.reduce((sum, position) => {
        const price = quotes[position.symbol]?.price ?? position.avgCost;
        return sum + position.shares * price;
      }, 0),
    [portfolio.positions, quotes],
  );

  const achievements = useMemo(
    () =>
      computeAchievements({
        transactions: portfolio.transactions,
        portfolioValue: portfolio.cashBalance + stockValue,
        positionSymbols: portfolio.positions
          .filter((position) => position.shares > 0)
          .map((position) => position.symbol),
      }),
    [portfolio.transactions, portfolio.cashBalance, portfolio.positions, stockValue],
  );

  const unlockedCount = countUnlockedAchievements(achievements);
  const allUnlocked = unlockedCount === achievements.length;

  return (
    <section className={`${card} ${cardPadding}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">
              Achievements
            </h2>
            <span
              className={cn(
                pillBadge,
                "bg-emerald-950/50 text-[10px] font-semibold uppercase tracking-wide text-emerald-400",
              )}
            >
              +1 point
            </span>
          </div>
          <p className={sectionSubtitle}>
            {unlockedCount} of {achievements.length} unlocked · updates live as you trade
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Score
          </p>
          <p className="text-xl font-semibold tracking-tight tabular-nums text-emerald-400">
            {unlockedCount}
          </p>
        </div>
      </div>

      {allUnlocked ? (
        <p className="mb-6 rounded-2xl border border-emerald-800/50 bg-emerald-950/25 px-5 py-4 text-sm font-medium leading-relaxed text-emerald-300">
          🎉 Congratulations! VIP Pro Trader status unlocked (0% trading fees applied)!
        </p>
      ) : (
        <p className={`mb-6 ${ruleBanner}`}>
          🎯 Rule: Collect all 4 achievement points to unlock VIP Pro Trader status – your
          trading fees will drop to 0% and you will grant free access to premium market
          insights!
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {achievements.map((achievement) => (
          <article
            key={achievement.id}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-5",
              btnTransition,
              achievement.unlocked
                ? "border-emerald-800/50 bg-gradient-to-br from-emerald-950/30 via-slate-800/80 to-teal-950/25 shadow-[0_0_32px_-8px_rgba(16,185,129,0.2)]"
                : "border-slate-700 bg-slate-900/60 opacity-70 grayscale",
            )}
          >
            {achievement.unlocked && (
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
            )}

            <div className="relative flex items-start justify-between gap-2">
              <span
                className={cn(
                  "text-2xl leading-none",
                  !achievement.unlocked && "opacity-60",
                )}
                aria-hidden
              >
                {achievement.emoji}
              </span>
              {achievement.unlocked ? (
                <span
                  className={cn(
                    pillBadge,
                    "gap-1 bg-emerald-600 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm",
                  )}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Unlocked
                </span>
              ) : (
                <span
                  className={cn(
                    pillBadge,
                    "gap-1 border border-slate-600 bg-slate-800/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500",
                  )}
                >
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              )}
            </div>

            <h3
              className={cn(
                "relative mt-4 text-sm font-semibold tracking-tight",
                achievement.unlocked ? "text-slate-100" : "text-slate-500",
              )}
            >
              {achievement.title}
              {achievement.id === "profitable-trade" && (
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-amber-400/80">
                  Golden Deal
                </span>
              )}
              {achievement.id === "whale-trader" && (
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-amber-400/80">
                  Banginis
                </span>
              )}
            </h3>
            <p className="relative mt-2 text-xs font-normal leading-relaxed text-slate-400">
              {achievement.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
