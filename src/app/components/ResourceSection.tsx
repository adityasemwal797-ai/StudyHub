"use client";

import { useState, useEffect } from "react";
import ResourceForm from "./ResourceForm";
import { BookOpen, Image as ImageIcon, Video, FileText, ArrowRight, ExternalLink } from "lucide-react";

export default function ResourceSection({ initialResources }: { initialResources: any[] }) {
  const [resources, setResources] = useState(initialResources);

  const refreshResources = async () => {
    try {
      const res = await fetch("/api/resources");
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Optionally poll or just trust the initial load
  }, []);

  const handleAdded = () => {
    refreshResources();
  };

  return (
    <section id="share" className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
      <div className="grid items-start gap-14 lg:grid-cols-2">
        <div className="lg:sticky lg:top-32">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-amber-700 mb-4">
            Open Access
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#0B1120] sm:text-5xl leading-[1.1]">
            Anyone Can Share. <br />
            <span className="text-amber-600">Everyone Benefits.</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#4B5563]">
            Post your study links, file folders, notes, and resources for free.
            The platform is open to all PG, graduate, and undergraduate students
            — no accounts required to browse, and anyone can contribute.
          </p>
          
          <div className="mt-10 space-y-6">
            <ResourceForm onResourceAdded={handleAdded} />
          </div>
        </div>

        <div>
          <div className="mb-10">
            <h3 className="text-2xl font-extrabold text-[#0B1120] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Latest Contributions
            </h3>
            <p className="text-slate-500 text-sm mt-1">Recently shared by students like you.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            {resources.map((r: any) => (
              <a
                key={r.id}
                href={r.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-start gap-5 rounded-[2rem] border border-amber-900/10 bg-white p-6 shadow-lg shadow-amber-900/5 transition hover:-translate-y-1 hover:shadow-2xl hover:border-amber-200"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition">
                  {r.type === "book" ? <BookOpen size={24} /> : 
                   r.type === "video" ? <Video size={24} /> : 
                   r.type === "image" ? <ImageIcon size={24} /> : 
                   r.type === "paper" ? <FileText size={24} className="text-rose-600" /> : 
                   <FileText size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                      {r.category}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold text-[#0B1120] group-hover:text-amber-700 transition truncate">{r.title}</h4>
                  <p className="mt-1 text-sm text-[#4B5563] line-clamp-1">{r.description || "No description provided."}</p>
                </div>
                <div className="self-center">
                   <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-amber-600 transition">
                      <ExternalLink size={18} />
                   </div>
                </div>
              </a>
            ))}
          </div>

          {resources.length === 0 && (
            <div className="text-center py-20 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50">
              <p className="text-slate-400 font-medium">No resources shared yet. Be the first!</p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
             <button className="text-sm font-bold text-slate-500 hover:text-amber-600 transition flex items-center gap-1">
                View All Community Files <ArrowRight size={16} />
             </button>
          </div>
        </div>
      </div>
    </section>
  );
}
