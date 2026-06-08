"use client";

import { Calendar, Clock } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import type { SimulationMode } from "@/lib/types";
import { cn, formatDate, todayISO } from "@/lib/utils";

export function TimeTravelMode() {
  const {
    simulationMode,
    setSimulationMode,
    simulatedDate,
    setSimulatedDate,
  } = useTrading();

  const modes: { id: SimulationMode; label: string }[] = [
    { id: "present", label: "Present" },
    { id: "simulated", label: "Simulated Date" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>Time Travel</span>
      </div>

      <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
        {modes.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSimulationMode(id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              simulationMode === id
                ? "bg-emerald-600 text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-zinc-400" />
        <input
          type="date"
          value={simulatedDate}
          max={todayISO()}
          disabled={simulationMode === "present"}
          onChange={(e) => setSimulatedDate(e.target.value)}
          className={cn(
            "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900",
            simulationMode === "present" &&
              "cursor-not-allowed opacity-50",
          )}
        />
      </div>

      {simulationMode === "simulated" && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          Trades will use {formatDate(simulatedDate)}
        </span>
      )}
    </div>
  );
}
