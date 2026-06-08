import { TradingProvider } from "@/context/TradingContext";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <TradingProvider>
      <Dashboard />
    </TradingProvider>
  );
}
