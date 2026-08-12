'use client';

import { AuthButton } from "@/components/auth/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="cursor-pointer text-[17px] font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          Pollify
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Suspense fallback={<div className="h-8 w-24 animate-pulse rounded-md bg-muted" />}>
            <AuthButton />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
