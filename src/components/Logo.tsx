"use client";

type Props = {
  size?: number;
  color?: string;
  className?: string;
};

/**
 * The Schema Sketch mark — a dot + arrow.
 *
 * Reads as "entity → output" — the dot evokes the round bubble that appears
 * in ER diagrams, the arrow evokes the conversion. Together: "schema → SQL."
 */
export function Logo({ size = 18, color, className = "" }: Props) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        color: color ?? "rgb(var(--accent))",
        height: size,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 44 28"
        width={(size * 44) / 28}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6" cy="14" r="4" fill="currentColor" stroke="none" />
        <line x1="14" y1="14" x2="36" y2="14" strokeWidth="2.5" />
        <path d="M 30 8 L 38 14 L 30 20" strokeWidth="2.5" />
      </svg>
    </span>
  );
}
