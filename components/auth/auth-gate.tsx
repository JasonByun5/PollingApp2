"use client";

import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { AuthLoadingSkeleton } from "@/components/loading-skeletons";
import { useRequireAuth, type AuthUser } from "@/hooks/use-require-auth";

type AuthGateProps = {
  children: (user: AuthUser) => React.ReactNode;
  /** Copy shown if auth fails before / while redirecting */
  description?: string;
  /** Default true — send unauthenticated users to /login */
  redirect?: boolean;
};

export function AuthGate({
  children,
  description = "Sign in to continue.",
  redirect = true,
}: AuthGateProps) {
  const { user, isLoading } = useRequireAuth({ redirect });

  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  if (!user) {
    return (
      <PageShell size="md">
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Authentication required
          </h2>
          <p className="text-muted-foreground">{description}</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return <>{children(user)}</>;
}
