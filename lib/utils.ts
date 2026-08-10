import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Admins are marked via Supabase app_metadata (only settable server-side
// with the service role, so regular users can never grant this to themselves).
export function isAdminUser(user: User | null | undefined): boolean {
  return user?.app_metadata?.is_admin === true;
}
