"use client";

import { TradeForm } from "./TradeForm";
import { AchievementsList } from "@/components/achievements/AchievementsList";
import { pageStack, sectionSubtitle, sectionTitle } from "@/lib/ui/classes";

export function TradeView() {
  return (
    <div className={pageStack}>
      <div>
        <h2 className={sectionTitle}>Place a Trade</h2>
        <p className={sectionSubtitle}>
          Buy or sell stocks using mock prices. All trades update your local portfolio
          instantly.
        </p>
      </div>
      <TradeForm />
      <AchievementsList />
    </div>
  );
}
