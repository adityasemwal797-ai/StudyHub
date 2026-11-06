"use client";

import { useState } from "react";
import { Menu, X, Library, UploadCloud, ArrowRight, PhoneCall } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Share Resources", href: "#share" },
    { label: "NCERT Books", href: "#ncert" },
    { label: "Study Planner", href: "#planner" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-amber-900/10 bg-[#FDF8F3]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-400/25 transition group-hover:shadow-amber-400/50 group-hover:scale-105">
            <Library size={22} strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <div className="text-lg font-extrabold tracking-tight text-[#0B1120]">StudyHub</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">For Every Student</div>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#374151] transition hover:bg-amber-50 hover:text-amber-700"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/call"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            <PhoneCall size={18} />
            Call Agent
          </a>
          <a
            href="#share"
            className="inline-flex items-center gap-2 rounded-full bg-[#0B1120] px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-[#0B1120]/20 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#0B1120]/30"
          >
            <UploadCloud size={18} />
            Contribute
          </a>
        </div>

        <button
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle menu"
          className="md:hidden rounded-xl p-2 text-[#0B1120] hover:bg-amber-50 transition"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-amber-900/10 bg-[#FDF8F3]/95 backdrop-blur-xl px-6 pb-6 pt-4 space-y-2 shadow-2xl">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-base font-semibold text-[#374151] hover:bg-amber-50 hover:text-amber-700 transition"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/call"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-bold text-emerald-700 hover:bg-emerald-50 transition"
          >
            <PhoneCall size={20} />
            Call the AI Agent
          </a>
          <a
            href="#share"
            onClick={() => setOpen(false)}
            className="block rounded-full bg-[#0B1120] px-5 py-3 text-center text-sm font-bold text-white shadow-lg"
          >
            Contribute Now
          </a>
        </div>
      )}
    </header>
  );
}
