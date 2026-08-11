'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [formCode, setFormCode] = useState("");
  const router = useRouter();

  return (
    <PageShell size="md">
      <div className="flex flex-col gap-10">
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Welcome to Pollify
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Enter a poll code to join, or jump into your dashboard and create something new.
          </p>
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (formCode.trim()) {
              router.push(`/polls/${formCode}`);
            }
          }}
        >
          <Label htmlFor="form-code" className="text-foreground">
            Poll code
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="form-code"
              type="text"
              placeholder="e.g. 1234"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              className="sm:flex-1"
            />
            <Button type="submit" className="sm:shrink-0">
              Continue
              <span aria-hidden="true">→</span>
            </Button>
          </div>
        </form>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="group flex flex-col items-start gap-1 rounded-lg border border-border bg-background p-5 text-left shadow-[0_1px_4px_rgba(26,31,54,0.04)] transition-colors hover:border-primary/40 hover:bg-secondary/60"
          >
            <span className="flex w-full items-center justify-between text-[15px] font-semibold text-foreground">
              Dashboard
              <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                →
              </span>
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              View and manage the polls you&apos;ve created.
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/create')}
            className="group flex flex-col items-start gap-1 rounded-lg border border-border bg-background p-5 text-left shadow-[0_1px_4px_rgba(26,31,54,0.04)] transition-colors hover:border-primary/40 hover:bg-secondary/60"
          >
            <span className="flex w-full items-center justify-between text-[15px] font-semibold text-foreground">
              Create a poll
              <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                →
              </span>
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              Build a new multi, yes/no, or ranked poll.
            </span>
          </button>
        </div>
      </div>
    </PageShell>
  );
}
