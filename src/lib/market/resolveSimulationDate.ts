import type { SimulationMode } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export function resolveSimulationDate(
  simulationMode: SimulationMode,
  simulatedDate: string,
): string | null {
  if (simulationMode === "simulated") {
    return simulatedDate;
  }

  return null;
}

export function resolveTradeDate(
  simulationMode: SimulationMode,
  simulatedDate: string,
): string {
  return simulationMode === "simulated" ? simulatedDate : todayISO();
}
