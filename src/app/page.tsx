"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor, type EditorHandle } from "@/components/Editor";
import { ShortcutHelp } from "@/components/ShortcutHelp";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { Shell } from "@/components/Shell";
import { tokenize } from "@/lib/parser/tokenize";
import { parse } from "@/lib/parser/parse";
import { validate } from "@/lib/parser/validate";
import { emit } from "@/lib/dialects";
import { ParseError } from "@/lib/parser/errors";
import { formatError } from "@/lib/parser/formatError";
import { useDebounced } from "@/lib/hooks/useDebounced";
import { useTheme } from "@/lib/hooks/useTheme";
import type { Dialect, NamingConvention } from "@/lib/dialects";
import { Highlight, themes } from "prism-react-renderer";
import { EXAMPLES } from "@/lib/examples";

const DEFAULT_SCHEMA = `erDiagram
CUSTOMER {
  int	id	[PK]
  string email [UK]
  string name
}
ORDER {
  int  id    	[PK]
  date placed_at
}
CUSTOMER ||--o{ ORDER : "places"`;

function SqlBlock({ code }: { code: string }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatches by ensuring client-only rendering for the code styles
  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);
  const prismTheme = theme === "dark" ? themes.oneDark : themes.github;

  if (!mounted) {
  return (
    <pre style={{ padding: "1rem", overflow: "auto", background: "#f6f8fa" }}>
      <code>{code}</code>
    </pre>
  );
  }
  return (
    <Highlight key={theme} code={code} language="sql" theme={prismTheme}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} h-full overflow-auto p-4 font-mono text-sm leading-relaxed`}
          style={{ ...style,color: style.color, backgroundColor: "transparent" }}
        >
           {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => {
                const tokenProps = getTokenProps({ token });
                return (
                  <span 
                    key={key} 
                    {...tokenProps}
                    style={{ ...tokenProps.style }} 
                  />
                );
              })}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

function SqlActions({ sql }: { sql: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!sql) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className="rounded-md border border-[rgb(var(--line))] bg-[rgb(var(--surface))] px-2.5 py-1 font-mono text-[11px] text-[rgb(var(--ink-soft))] transition-colors hover:border-[rgb(var(--ink-soft))] hover:text-[rgb(var(--ink))]"
      >
        {copied ? (
          <span className="text-[rgb(var(--accent))]">copied</span>
        ) : (
          "copy"
        )}
      </button>
      <button
        onClick={handleDownload}
        className="rounded-md border border-[rgb(var(--line))] bg-[rgb(var(--surface))] px-2.5 py-1 font-mono text-[11px] text-[rgb(var(--ink-soft))] transition-colors hover:border-[rgb(var(--ink-soft))] hover:text-[rgb(var(--ink))]"
      >
        download
      </button>
    </>
  );
}

function ErrorBanner({ error }: { error: string }) {
  const lines = error.split("\n");
  const message = lines[0];
  const codeBlock = lines.slice(1).join("\n").trim();

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 font-mono text-xs uppercase tracking-wider text-red-600">
        error
      </span>
      <div className="flex-1 space-y-2">
        <div className="font-mono text-sm text-red-700 dark:text-red-400">{message}</div>
        {codeBlock && (
          <pre
            className="overflow-x-auto whitespace-pre rounded border px-3 py-2 font-mono text-xs"
            style={{
              backgroundColor: "rgba(var(--error-bg), 0.4)",
              borderColor: "rgb(var(--error-border))",
              color: "rgb(var(--error-text))",
            }}
          >
            {codeBlock}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  // ─── State ──────────────────────────────────────────
  const [source, setSource] = useState(DEFAULT_SCHEMA);
  const [dialect, setDialect] = useState<Dialect>("oracle");
  const [naming, setNaming] = useState<NamingConvention>("snake_case");
  const [addTimestamps, setAddTimestamps] = useState(false);
  const [addAuditColumns, setAddAuditColumns] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string>("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const editorRef = useRef<EditorHandle>(null);

  // Debounce the source so we don't re-parse on every keystroke
  const debouncedSource = useDebounced(source, 300);   // for parsing
  const debouncedError = useDebounced(source, 800);    // for showing errors
  const isComputing = source !== debouncedSource;

  // ─── Derived state — pure computation ───────────────
  const [lastGoodSql, setLastGoodSql] = useState<string | null>(null);

  const result = useMemo(() => {
    if (debouncedSource.trim().length === 0) {
      return { sql: null, error: null, status: "empty" as const };
    }
    try {
      const schema = parse(tokenize(debouncedSource));
      const errors = validate(schema);
      if (errors.length > 0) {
        return {
          sql: null,
          error: `${errors[0].message} (line ${errors[0].line})`,
          status: "error" as const,
        };
      }
      const sql = emit(schema, { dialect, naming, addTimestamps, addAuditColumns });
      return { sql, error: null, status: "ok" as const };
    } catch (e) {
      if (e instanceof ParseError) {
        return { sql: null, error: formatError(e, debouncedSource), status: "error" as const };
      }
      return { sql: null, error: e instanceof Error ? e.message : "Unknown error", status: "error" as const };
    }
  }, [debouncedSource, dialect, naming, addTimestamps, addAuditColumns]);

  const settledResult = useMemo(() => {
    if (debouncedError.trim().length === 0) {
      return { error: null, status: "empty" as const };
    }
    try {
      const schema = parse(tokenize(debouncedError));
      const errors = validate(schema);
      if (errors.length > 0) {
        return {
          error: `${errors[0].message} (line ${errors[0].line})`,
          status: "error" as const,
        };
      }
      return { error: null, status: "ok" as const };
    } catch (e) {
      if (e instanceof ParseError) {
        return { error: formatError(e, debouncedError), status: "error" as const };
      }
      return { error: e instanceof Error ? e.message : "Unknown error", status: "error" as const };
    }
  }, [debouncedError]);

  const errorLine = useMemo(() => {
    if (settledResult.status !== "error" || !settledResult.error) return null;
    const match = settledResult.error.match(/^line (\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, [settledResult]);

  const handleCopySQL = useCallback(async () => {
    const sql = result.sql ?? lastGoodSql;
    if (!sql) return;
    try {
      await navigator.clipboard.writeText(sql);
    } catch {
      // Clipboard API can fail in non-secure contexts; silent fail is fine
    }
  }, [result.sql, lastGoodSql]);

  useKeyboardShortcuts([
    {
      key: "k",
      meta: true,
      handler: () => editorRef.current?.focus(),
    },
    {
      key: "Enter",
      meta: true,
      handler: handleCopySQL,
    },
    {
      key: "1",
      meta: true,
      handler: () => setDialect("oracle"),
    },
    {
      key: "2",
      meta: true,
      handler: () => setDialect("postgres"),
    },
    {
      key: "3",
      meta: true,
      handler: () => setDialect("mysql"),
    },
    {
      key: "?",
      shift: true,
      ignoreInInputs: true,
      handler: () => setShowShortcuts(true),
    },
    {
      key: "Escape",
      handler: () => setShowShortcuts(false),
    },
  ]);

  // Avoid dependency loop: use functional update and depend only on result.sql
  useEffect(() => {
    if (result.sql !== null) {
      Promise.resolve().then(() => setLastGoodSql(prev => (prev !== result.sql ? result.sql : prev)));
    }
  }, [result.sql]);

  // Avoid direct setState in effect: only update if selectedExample is set and source mismatches
  useEffect(() => {
    if (!selectedExample) return;
    const example = EXAMPLES.find((x) => x.name === selectedExample);
    if (example && source !== example.source) {
      // Use a microtask to avoid cascading renders
      Promise.resolve().then(() => setSelectedExample(""));
    }
  }, [source, selectedExample]);

  // ─── Render ─────────────────────────────────────────
  return (
    <>
      <Shell
        toolbar={
          <>
            <select
              value={selectedExample}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedExample(name);
                const example = EXAMPLES.find((x) => x.name === name);
                if (example) setSource(example.source);
              }}
              className="rounded-md border border-[rgb(var(--line))] bg-[rgb(var(--surface))] px-2.5 py-1 font-mono text-[11px] text-[rgb(var(--ink))] hover:border-[rgb(var(--ink-soft))] focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-soft))]"
            >
              <option value="">load example…</option>
              {EXAMPLES.map((ex) => (
                <option key={ex.name} value={ex.name}>{ex.name}</option>
              ))}
            </select>
            <span className="h-5 w-px bg-[rgb(var(--line))]" aria-hidden />
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              className="rounded-md border border-[rgb(var(--line))] bg-[rgb(var(--surface))] px-2.5 py-1 font-mono text-[11px] text-[rgb(var(--ink))] hover:border-[rgb(var(--ink-soft))] focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-soft))]"
            >
              <option value="oracle">Oracle</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </select>
            <select
              value={naming}
              onChange={(e) => setNaming(e.target.value as NamingConvention)}
              className="rounded-md border border-[rgb(var(--line))] bg-[rgb(var(--surface))] px-2.5 py-1 font-mono text-[11px] text-[rgb(var(--ink))] hover:border-[rgb(var(--ink-soft))] focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-soft))]"
            >
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
            </select>
            <span className="h-5 w-px bg-[rgb(var(--line))]" aria-hidden />
            <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-[rgb(var(--ink-soft))] hover:text-[rgb(var(--ink))]">
              <input
                type="checkbox"
                checked={addTimestamps}
                onChange={(e) => setAddTimestamps(e.target.checked)}
                className="h-3.5 w-3.5 accent-[rgb(var(--accent))]"
              />
              timestamps
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-[rgb(var(--ink-soft))] hover:text-[rgb(var(--ink))]">
              <input
                type="checkbox"
                checked={addAuditColumns}
                onChange={(e) => setAddAuditColumns(e.target.checked)}
                className="h-3.5 w-3.5 accent-[rgb(var(--accent))]"
              />
              audit
            </label>
            <span
              className={`flex items-center gap-1.5 font-mono text-[11px] transition-opacity ${
                isComputing ? "text-[rgb(var(--muted))] opacity-100" : "opacity-0"
              }`}
              aria-hidden={!isComputing}
            >
              <span className="animate-pulse-soft inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" aria-hidden />
              computing
            </span>
          </>
        }
        errorBanner={
          settledResult.status === "error" ? (
            <ErrorBanner error={settledResult.error!} />
          ) : null
        }
        left={<Editor ref={editorRef} value={source} onChange={setSource} errorLine={errorLine} />}
        right={
          result.sql || lastGoodSql ? (
            <div key={dialect} className="animate-fade-in h-full">
              <SqlBlock code={result.sql ?? lastGoodSql ?? ""} />
            </div>
          ) : (
            <div className="h-full p-4 font-mono text-sm text-[rgb(var(--muted))]">
              Type a Mermaid <code>erDiagram</code> in the left pane to see SQL here.
            </div>
          )
        }
        rightActions={<SqlActions sql={result.sql ?? lastGoodSql} />}
        footerSlot={
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-1 font-mono text-[11px] text-[rgb(var(--muted))] hover:text-[rgb(var(--ink))]"
          >
            <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-1 text-[10px]">
              ?
            </kbd>
            shortcuts
          </button>
        }
      />
      <ShortcutHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
