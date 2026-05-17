"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  errorLine?: number | null;
};

export type EditorHandle = {
  focus: () => void;
};

export const Editor = forwardRef<EditorHandle, Props>(function Editor(
  { value, onChange, errorLine },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }), []);

  useEffect(() => {
    const textarea = textareaRef.current;
    const lineNumbers = lineNumbersRef.current;
    if (!textarea || !lineNumbers) return;

    const handleScroll = () => {
      lineNumbers.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener("scroll", handleScroll);
    return () => textarea.removeEventListener("scroll", handleScroll);
  }, []);

  const lineCount = Math.max(value.split("\n").length, 1);

  return (
    <div className="flex h-full overflow-hidden bg-[rgb(var(--surface))]">
      <div
        ref={lineNumbersRef}
        aria-hidden="true"
        className="pointer-events-none hidden shrink-0 select-none overflow-hidden border-r border-[rgb(var(--line-soft))] bg-[rgb(var(--bg))] px-3 py-4 font-mono text-[13px] leading-[1.65] text-[rgb(var(--muted))] md:block"
      >
        {Array.from({ length: lineCount }, (_, i) => {
          const isErrorLine = errorLine === i + 1;
          return (
            <div
              key={i}
              className={`text-right ${isErrorLine ? "font-medium text-red-600" : ""}`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        wrap="off"
        className="h-full min-w-0 flex-1 resize-none bg-transparent p-3 md:p-4 font-mono text-[13px] leading-[1.65] text-[rgb(var(--ink))] outline-none"
      />
    </div>
  );
});
