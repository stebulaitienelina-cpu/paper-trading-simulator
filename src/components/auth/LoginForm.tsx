"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { getSession, signInWithEmail, signUpWithEmail } from "@/lib/auth";
import {
  alertError,
  alertSuccess,
  btnTransition,
  card,
  cardPadding,
  inputField,
  pageBg,
} from "@/lib/ui/classes";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    void getSession().then((session) => {
      if (!isMounted) {
        return;
      }

      if (session) {
        router.replace("/");
        return;
      }

      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const result =
      mode === "sign-in"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, username);

    if (!result.success) {
      setFeedback({ type: "error", message: result.error });
      setIsSubmitting(false);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setFeedback({
        type: "success",
        message: "Account created. Check your email to confirm, then sign in.",
      });
      setMode("sign-in");
      setUsername("");
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
  };

  if (isCheckingSession) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 ${pageBg}`}>
        <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
        <p className="text-sm font-medium text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 py-12 ${pageBg}`}>
      <div className={`mx-auto w-full max-w-md ${card} ${cardPadding}`}>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            Paper Trading Simulator
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "sign-in"
              ? "Sign in to access your portfolio"
              : "Create an account to get started"}
          </p>
        </div>

        <div className="mb-6 flex rounded-xl border border-slate-700 bg-slate-950/50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("sign-in");
              setUsername("");
              setFeedback(null);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium",
              btnTransition,
              mode === "sign-in"
                ? "bg-slate-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("sign-up");
              setFeedback(null);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium",
              btnTransition,
              mode === "sign-up"
                ? "bg-slate-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            <UserPlus className="h-4 w-4" />
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "sign-up" && (
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={2}
                maxLength={32}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your_username"
                className={inputField}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputField}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={inputField}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60",
              btnTransition,
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "sign-in" ? "Signing in…" : "Creating account…"}
              </>
            ) : mode === "sign-in" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {feedback?.type === "success" && <p className={`mt-5 ${alertSuccess}`}>{feedback.message}</p>}
        {feedback?.type === "error" && <p className={`mt-5 ${alertError}`}>{feedback.message}</p>}
      </div>
    </div>
  );
}
