"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type AuthUser = {
  id: string;
  email: string;
};

type UseRequireAuthOptions = {
  /** When true (default), navigate to login if unauthenticated */
  redirect?: boolean;
  redirectTo?: string;
};

/**
 * Client-side auth gate used by protected app pages.
 * Complements middleware redirects when the session is missing or expired.
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirect = true, redirectTo = "/login" } = options;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const claims = data?.claims;

      if (cancelled) return;

      if (claims?.sub) {
        setUser({
          id: claims.sub,
          email: typeof claims.email === "string" ? claims.email : "",
        });
        setIsLoading(false);
        return;
      }

      setUser(null);
      setIsLoading(false);
      if (redirect) {
        router.replace(redirectTo);
      }
    };

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [redirect, redirectTo, router]);

  return { user, isLoading };
}
