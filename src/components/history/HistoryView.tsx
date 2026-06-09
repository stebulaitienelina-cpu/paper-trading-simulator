"use client";

import { TransactionsTable } from "./TransactionsTable";
import { pageStack, sectionSubtitle, sectionTitle } from "@/lib/ui/classes";

export function HistoryView() {
  return (
    <div className={pageStack}>
      <div>
        <h2 className={sectionTitle}>Transaction History</h2>
        <p className={sectionSubtitle}>
          All simulated trades with the date they were recorded under.
        </p>
      </div>
      <TransactionsTable />
    </div>
  );
}
