"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { pageBg } from "@/lib/ui/classes";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const session = await getSession();

        if (!isMounted) {
          return;
        }

        if (session) {
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }

        router.replace("/login");
      } catch {
        if (isMounted) {
          router.replace("/login");
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    void verifySession();

    const unsubscribe = onAuthStateChange((session) => {
      if (!isMounted) {
        return;
      }

      if (session) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      setIsAuthenticated(false);
      router.replace("/login");
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  if (isChecking) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 ${pageBg}`}>
        <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
        <p className="text-sm font-medium text-slate-400">Checking authentication…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
