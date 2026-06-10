"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, onAuthStateChange, resolveDisplayUsername } from "@/lib/auth";

export function UserDisplay() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getCurrentUser().then((currentUser) => {
      if (isMounted) {
        setUser(currentUser);
        setIsLoading(false);
      }
    });

    const unsubscribe = onAuthStateChange((session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const displayName = isLoading ? "…" : resolveDisplayUsername(user);

  return (
    <p className="text-sm font-medium text-emerald-400">
      Welcome, <span className="text-slate-100">{displayName}</span>
    </p>
  );
}
