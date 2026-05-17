import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Schema Sketch — Mermaid to SQL DDL Generator",
  description:
    "Generate production-grade SQL DDL from Mermaid erDiagram syntax. Live preview across Oracle, PostgreSQL, and MySQL. No signup, no AI.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ]
  },  
  keywords: [
    "mermaid to sql",
    "erdiagram",
    "sql ddl generator",
    "mermaid erdiagram",
    "oracle ddl",
    "postgresql schema",
    "mysql schema generator",
    "database schema design",
  ],
  authors: [{ name: "Aniket Dewnani", url: "https://aniket-dewnani-portfolio.vercel.app" }],
  creator: "Aniket Dewnani",
  metadataBase: new URL("https://schema-sketch.vercel.app"), //Dummy URL for now, will update when deployed
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};
// Inline script runs before React hydrates — prevents flash of wrong theme.
// Reads localStorage first, falls back to OS preference, defaults to light.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        {/* <script dangerouslySetInnerHTML={{ __html: themeScript }} /> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
