"use client";

import { Calendar, Clock } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import type { SimulationMode } from "@/lib/types";
import {
  btnTransition,
  card,
  inputField,
  pillBadge,
  toggleGroup,
  toggleInactive,
} from "@/lib/ui/classes";
import { cn, formatDate, todayISO } from "@/lib/utils";

export function TimeTravelMode() {
  const { simulationMode, setSimulationMode, simulatedDate, setSimulatedDate } =
    useTrading();

  const modes: { id: SimulationMode; label: string }[] = [
    { id: "present", label: "Present" },
    { id: "simulated", label: "Simulated Date" },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-3 ${card} px-4 py-3`}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Clock className="h-4 w-4 text-emerald-400" />
        <span>Time Travel</span>
      </div>

      <div className={toggleGroup}>
        {modes.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSimulationMode(id)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-medium",
              btnTransition,
              simulationMode === id
                ? "bg-emerald-600 text-white shadow-sm"
                : toggleInactive,
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-500" />
        <input
          type="date"
          value={simulatedDate}
          max={todayISO()}
          disabled={simulationMode === "present"}
          onChange={(e) => setSimulatedDate(e.target.value)}
          className={cn(
            inputField,
            "w-auto py-2",
            simulationMode === "present" && "cursor-not-allowed opacity-50",
          )}
        />
      </div>

      {simulationMode === "simulated" && (
        <span className={cn(pillBadge, "bg-emerald-950/40 text-emerald-400")}>
          Trades will use {formatDate(simulatedDate)}
        </span>
      )}
    </div>
  );
}
