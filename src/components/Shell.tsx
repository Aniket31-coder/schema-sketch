"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

type Props = {
  toolbar: ReactNode;
  left: ReactNode;
  right: ReactNode;
  rightActions?: ReactNode;
  errorBanner?: ReactNode;
  footerSlot?: ReactNode;
};

export function Shell({ toolbar, left, right, rightActions, errorBanner, footerSlot }: Props) {
  return (
    <div className="flex h-screen flex-col bg-[rgb(var(--bg))] text-[rgb(var(--ink))]">
      {/* Header */}
      <header className="border-b border-[rgb(var(--line))] bg-[rgb(var(--surface))]">
        <div className="flex flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:justify-between md:gap-4 md:px-5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <Logo size={18} />
            <span
              className="font-serif text-[18px] italic leading-none text-[rgb(var(--ink))] md:text-[19px]"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Schema Sketch
            </span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--muted))] sm:inline">
              mermaid → sql
            </span>
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <a
                href="https://github.com/Aniket31-coder/schema-sketch"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--ink-soft))] hover:text-[rgb(var(--ink))]"
              >
                github
                <span aria-hidden>↗</span>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {toolbar}
            <span className="mx-1 hidden h-5 w-px bg-[rgb(var(--line))] md:inline-block" aria-hidden />
            <div className="hidden md:flex md:items-center md:gap-2">
              <ThemeToggle />
              <a
                href="https://github.com/Aniket31-coder/schema-sketch"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[rgb(var(--ink-soft))] hover:text-[rgb(var(--ink))]"
              >
                github
                <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Optional error banner */}
      {errorBanner && (
        <div className="border-b border-red-200/60 bg-red-50/40 px-5 py-3 custom-dark:border-red-900/40 custom-dark:bg-red-950/20">
          {errorBanner}
        </div>
      )}

      {/* Two-pane content */}
      <main className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left pane */}
        <section className="flex h-1/2 min-h-0 min-w-0 flex-col border-b border-[rgb(var(--line))] bg-[rgb(var(--surface))] md:h-auto md:flex-1 md:border-b-0 md:border-r">
          <div className="flex h-10 items-center justify-between border-b border-[rgb(var(--line))] px-5">
            <span className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[rgb(var(--ink-soft))]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--muted))]"
                aria-hidden
              />
              Mermaid
            </span>
          </div>
          <div className="min-w-0 min-h-0 flex-1 overflow-hidden">{left}</div>
        </section>

        {/* Right pane */}
        <section className="flex h-1/2 min-h-0 min-w-0 flex-col bg-[rgb(var(--surface))] md:h-auto md:flex-1">
          <div className="flex h-10 items-center justify-between border-b border-[rgb(var(--line))] px-5">
            <span className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[rgb(var(--ink-soft))]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]"
                aria-hidden
              />
              SQL
            </span>
            {rightActions && <div className="flex items-center gap-1.5">{rightActions}</div>}
          </div>
          <div className="min-w-0 min-h-0 flex-1 overflow-auto">{right}</div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[rgb(var(--line))] bg-[rgb(var(--surface))] px-5 py-2.5">
        <span className="font-mono text-[11px] text-[rgb(var(--muted))]">
          built by{" "}
          <a
            href="https://aniket-dewnani-portfolio.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[rgb(var(--ink-soft))] hover:text-[rgb(var(--ink))]"
          >
            Aniket Dewnani
          </a>
        </span>
        {footerSlot}
      </footer>
    </div>
  );
}
