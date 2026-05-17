import { useEffect } from "react";

export type ShortcutHandler = {
  key: string;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  ignoreInInputs?: boolean;
};

function isInputElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const inInput = isInputElement(e.target);

      for (const sc of shortcuts) {
        if (sc.key.toLowerCase() !== e.key.toLowerCase()) continue;
        if (sc.meta && !(e.metaKey || e.ctrlKey)) continue;
        if (!sc.meta && (e.metaKey || e.ctrlKey)) continue;
        if (sc.shift && !e.shiftKey) continue;
        if (sc.ignoreInInputs && inInput) continue;

        e.preventDefault();
        sc.handler();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
