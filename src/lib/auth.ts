import type { AuthError, Session, User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function toAuthErrorMessage(error: AuthError | Error): string {
  return error.message || "Authentication failed.";
}

export async function getSession(): Promise<Session | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { success: false, error: toAuthErrorMessage(error) };
    }

    return {
      success: true,
      data: { user: data.user, session: data.session },
    };
  } catch (error) {
    return {
      success: false,
      error: toAuthErrorMessage(error instanceof Error ? error : new Error(String(error))),
    };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string,
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });

    if (error) {
      return { success: false, error: toAuthErrorMessage(error) };
    }

    return {
      success: true,
      data: { user: data.user, session: data.session },
    };
  } catch (error) {
    return {
      success: false,
      error: toAuthErrorMessage(error instanceof Error ? error : new Error(String(error))),
    };
  }
}

export async function signOut(): Promise<AuthResult<null>> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: toAuthErrorMessage(error) };
    }

    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: toAuthErrorMessage(error instanceof Error ? error : new Error(String(error))),
    };
  }
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}

export function resolveDisplayUsername(user: User | null | undefined): string {
  if (!user) {
    return "Trader";
  }

  const metadataUsername = user.user_metadata?.username;
  if (typeof metadataUsername === "string" && metadataUsername.trim()) {
    return metadataUsername.trim();
  }

  const emailPrefix = user.email?.split("@")[0]?.trim();
  if (emailPrefix) {
    return emailPrefix;
  }

  return "Trader";
}
