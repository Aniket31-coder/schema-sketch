"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const IS_MAC =
  typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
const MOD = IS_MAC ? "⌘" : "Ctrl";

const SHORTCUTS = [
  { keys: [MOD, "K"], description: "Focus the editor" },
  { keys: [MOD, "Enter"], description: "Copy generated SQL" },
  { keys: [MOD, "1"], description: "Switch to Oracle" },
  { keys: [MOD, "2"], description: "Switch to PostgreSQL" },
  { keys: [MOD, "3"], description: "Switch to MySQL" },
  { keys: ["?"], description: "Open this help" },
  { keys: ["Esc"], description: "Close this help" },
];

export function ShortcutHelp({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-[min(420px,90vw)] rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--surface))] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[rgb(var(--ink-soft))]">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="font-mono text-[11px] text-[rgb(var(--muted))] hover:text-[rgb(var(--ink))]"
            aria-label="Close shortcuts"
          >
            esc
          </button>
        </div>

        <ul className="space-y-2.5">
          {SHORTCUTS.map((sc, i) => (
            <li key={i} className="flex items-center justify-between gap-4">
              <span className="font-mono text-[12px] text-[rgb(var(--ink))]">
                {sc.description}
              </span>
              <span className="flex items-center gap-1">
                {sc.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-1.5 font-mono text-[11px] text-[rgb(var(--ink-soft))]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
