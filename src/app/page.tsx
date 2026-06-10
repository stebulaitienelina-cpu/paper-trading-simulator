import { AuthGuard } from "@/components/auth/AuthGuard";
import { TradingProvider } from "@/context/TradingContext";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <AuthGuard>
      <TradingProvider>
        <Dashboard />
      </TradingProvider>
    </AuthGuard>
  );
}
