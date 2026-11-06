import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyHub — Free NCERT Books & Student Resources | Call the AI Agent",
  description:
    "Community-driven platform where students share links, files, books and study notes — with a built-in AI voice agent you can talk to in the browser or have call your phone.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
