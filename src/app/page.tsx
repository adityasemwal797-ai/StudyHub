import { db, dbReady } from "@/db";
import { resources, plannerTasks } from "@/db/schema";
import { sql } from "drizzle-orm";
import StudyPlanner from "./components/StudyPlanner";
import Navbar from "./components/Navbar";
import FadeUp from "./components/FadeUp";
import Scene4D from "./components/Scene4D";
import ResourceSection from "./components/ResourceSection";
import {
  Phone,
  BookOpen,
  Link2,
  FolderOpen,
  FileText,
  ArrowRight,
  UploadCloud,
  Library,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getResources() {
  await dbReady();
  try {
    return await db.select().from(resources).limit(8).orderBy(sql`${resources.createdAt} DESC`);
  } catch (err) {
    console.error("[home] resource fetch failed:", err);
    return [] as (typeof resources.$inferSelect)[];
  }
}

async function getTasks() {
  return db.select().from(plannerTasks).orderBy(plannerTasks.createdAt);
}

export default async function HomePage() {
  const resourcesData = await getResources();

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-[#111827] font-sans selection:bg-amber-200 selection:text-amber-950">
      <Navbar />
      <main>
        <Hero />
        <FeatureCards />
        <ResourceSection initialResources={resourcesData} />
        <NCERTSection resources={resourcesData.filter(r => r.category.toLowerCase().includes('ncert'))} />
        <StudyPlanner />
        <CommunityCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0B1120] via-[#111827] to-[#0B1120] text-white">
      {/* Soft glow shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-amber-400/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-sky-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-36">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <FadeUp>
          <div>
            <a
              href="#ncert"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-300 backdrop-blur-sm transition hover:bg-amber-400/20 hover:border-amber-400/50"
            >
              <Sparkles size={16} /> All NCERT Books are Free & Open
            </a>
            <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] sm:text-7xl lg:text-[5.5rem]">
              Share Your Study{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
                Resources
              </span>
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-slate-300 sm:text-xl max-w-xl">
              A community-driven space where PG, graduate, and undergraduate
              students share links, files, folders, books, and study notes to
              help everyone grow together. Open to all. Zero cost.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#share"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-4 text-base font-extrabold text-[#0B1120] shadow-xl shadow-amber-400/25 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-400/40"
              >
                Browse Resources <ArrowRight size={20} />
              </a>
              <a
                href="/call"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-7 py-4 text-base font-bold text-emerald-300 backdrop-blur-sm transition hover:bg-emerald-400/20 hover:border-emerald-400/60"
              >
                <Phone size={20} /> Call the AI Agent
              </a>
            </div>

            <div className="mt-12 flex items-center gap-6 text-sm font-medium text-slate-400">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i * 7}`}
                    alt="Student"
                    className="h-9 w-9 rounded-full border-2 border-[#0B1120] object-cover shadow-md"
                  />
                ))}
              </div>
              <span>
                <strong className="text-white">2,430+</strong> students sharing today
              </span>
            </div>
          </div>
          </FadeUp>

          <div className="relative">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/30 ring-1 ring-white/10">
              <img
                src="/hero-study.jpg"
                alt="Student study materials"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/60 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-white/10 bg-[#0B1120]/90 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 max-w-[220px]">
              <div className="mb-2 flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-widest">
                <BookOpen size={14} /> Latest Shared
              </div>
              <div className="text-sm font-semibold leading-snug text-white">
                NCERT Class 12 Physics — Chapter 5 Solutions
              </div>
              <div className="mt-2 text-xs text-slate-400">Shared 12 minutes ago</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Feature Cards ---------- */
function FeatureCards() {
  const cards = [
    {
      icon: Link2,
      title: "Share Links",
      desc: "Post website links, video tutorials, and article collections for any subject.",
      color: "from-amber-400 to-amber-600",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: UploadCloud,
      title: "Upload Files",
      desc: "Share PDFs, ZIP folders, notes, and lecture recordings safely.",
      color: "from-sky-400 to-sky-600",
      bg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      icon: Library,
      title: "NCERT Books",
      desc: "Access complete NCERT textbooks for all classes — fully free and open.",
      color: "from-rose-400 to-rose-600",
      bg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      icon: Sparkles,
      title: "3D Plan",
      desc: "Use interactive charts, stopwatch, and task lists for study planning.",
      color: "from-emerald-400 to-emerald-600",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <section className="relative z-10 -mt-14 mx-auto max-w-7xl px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <a
            key={c.title}
            href={c.title === "3D Plan" ? "#planner" : c.title === "NCERT Books" ? "#ncert" : "#share"}
            className="group relative rounded-3xl border border-amber-900/10 bg-white p-7 shadow-xl shadow-amber-900/5 transition hover:-translate-y-2 hover:shadow-2xl hover:border-amber-200"
          >
            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-lg shadow-amber-900/10 group-hover:scale-105 transition mb-5`}>
              <c.icon size={28} strokeWidth={2} />
            </div>
            <h3 className="text-xl font-extrabold text-[#0B1120] tracking-tight">{c.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">{c.desc}</p>
            <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-amber-700 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition">
              Explore <ArrowRight size={16} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}



/* ---------- NCERT Section ---------- */
function NCERTSection({ resources }: { resources: any[] }) {
  return (
    <section id="ncert" className="relative bg-gradient-to-b from-[#FDF8F3] via-amber-50/40 to-[#FDF8F3]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-extrabold uppercase tracking-widest text-amber-800 mb-5">
            <Library size={16} /> NCERT Resources
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#0B1120] sm:text-5xl leading-[1.1]">
            All NCERT Books <br />
            <span className="text-amber-600">Available Online</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[#4B5563]">
            Download or browse official NCERT textbooks and supplementary
            resources for Classes 6 through 12 — completely free.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((r: any) => (
            <a
              key={r.id}
              href={r.url || "#"}
              target={r.url ? "_blank" : undefined}
              rel={r.url ? "noopener noreferrer" : undefined}
              className="group relative flex flex-col rounded-3xl border border-amber-900/10 bg-white p-6 shadow-lg shadow-amber-900/5 transition hover:-translate-y-2 hover:shadow-2xl hover:border-amber-200 hover:ring-1 hover:ring-amber-100"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-400/20`}>
                  {r.type === "book" ? <BookOpen size={18} /> : r.type === "folder" ? <FolderOpen size={18} /> : r.type === "link" ? <Link2 size={18} /> : <FileText size={18} />}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">
                  {r.category}
                </span>
              </div>
              <h3 className="text-lg font-extrabold leading-snug text-[#0B1120] group-hover:text-amber-700 transition">{r.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#4B5563]">{r.description}</p>
              <div className="mt-5 flex items-center gap-2 text-sm font-bold text-amber-700">
                {r.url ? (
                  <>
                    Open Resource <ExternalLink size={16} />
                  </>
                ) : (
                  "View Details"
                )}
              </div>
            </a>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-[#0B1120] px-8 py-4 text-base font-extrabold text-white shadow-2xl shadow-[#0B1120]/20 transition hover:-translate-y-1 hover:shadow-amber-900/30"
          >
            View All Resources <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Community CTA ---------- */
function CommunityCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-r from-[#0B1120] to-[#1a2330] text-white shadow-2xl shadow-[#0B1120]/20">
        <div className="absolute inset-0 opacity-20">
          <img src="/planner-visual.jpg" alt="" className="h-full w-full object-cover mix-blend-overlay" />
        </div>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400/20 blur-[90px]" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-400/20 blur-[90px]" />

        <div className="relative z-10 grid items-center gap-12 px-10 py-20 lg:grid-cols-2 lg:px-16 lg:py-24">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-[1.1]">
              Ready to Help{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                Other Students?
              </span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Whether you have notes, links, books, or folder collections — share
              them freely. Your contribution makes studying easier for the entire
              student community.
            </p>
            <ul className="mt-8 space-y-3 text-slate-300 font-medium">
              {[
                "No account needed to browse",
                "Contribute in seconds",
                "Open to PG, graduate & undergraduate students",
                "All resources are freely accessible",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                    <ChevronRight size={14} />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#share"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 text-base font-extrabold text-[#0B1120] shadow-xl shadow-amber-400/25 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-400/40"
              >
                Share Your Resources <ArrowRight size={20} />
              </a>
              <a
                href="#planner"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                Try the 3D Planner <ChevronRight size={20} />
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl shadow-black/30 ring-1 ring-white/10 rotate-1 hover:rotate-0 transition duration-500">
              <img src="/hero-study.jpg" alt="Study" className="w-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="border-t border-amber-900/10 bg-[#0B1120] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-400/25 transition group-hover:scale-105">
                <Library size={22} strokeWidth={2.5} />
              </div>
              <div className="leading-none">
                <div className="text-lg font-extrabold tracking-tight">StudyHub</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">For Every Student</div>
              </div>
            </a>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
              A free, open platform for PG, graduate, and undergraduate students
              to share study links, files, books, and notes. Built for learning
              together — for everyone.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-4">Sections</h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-300">
              {["Share Resources", "NCERT Books", "3D Planner", "Study Tools"].map((i) => (
                <li key={i}><a href="#" className="hover:text-amber-300 transition hover:underline underline-offset-2">{i}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-4">Community</h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-300">
              {["Contribute", "Browse All", "Rules", "Contact"].map((i) => (
                <li key={i}><a href="#" className="hover:text-amber-300 transition hover:underline underline-offset-2">{i}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500 font-medium">© {new Date().getFullYear()} StudyHub. Open to all students. Made with care.</p>
          <div className="flex gap-6 text-xs font-bold text-slate-400">
            <a href="#" className="hover:text-amber-300 transition">Privacy</a>
            <a href="#" className="hover:text-amber-300 transition">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
