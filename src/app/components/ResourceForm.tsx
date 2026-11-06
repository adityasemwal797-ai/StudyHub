"use client";

import { useState } from "react";
import { UploadCloud, Link2, FileText, FolderOpen, BookOpen, Send, CheckCircle2, XCircle } from "lucide-react";
import FadeUp from "./FadeUp";

export default function ResourceForm({ onResourceAdded }: { onResourceAdded?: (resource: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "file",
    url: "",
    description: "",
    category: "General Study",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus("success");
        setFormData({ title: "", type: "file", url: "", description: "", category: "General Study" });
        if (onResourceAdded) onResourceAdded(data.resource);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { id: "image", label: "Image", icon: UploadCloud },
    { id: "file", label: "File", icon: FileText },
    { id: "video", label: "Video", icon: Send },
    { id: "book", label: "Book", icon: BookOpen },
    { id: "paper", label: "Paper", icon: FileText },
  ];

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-900/10 bg-white p-8 shadow-2xl shadow-amber-900/10 ring-1 ring-amber-900/5">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold text-[#0B1120]">Contribute a Resource</h3>
        <p className="text-sm text-slate-500 mt-1">Share links, files, or notes with the student community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Resource Title</label>
          <input
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Organic Chemistry Short Notes"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/10 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Type</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: t.id })}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition ${
                  formData.type === t.id
                    ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm"
                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <t.icon size={20} />
                <span className="text-[10px] font-bold uppercase">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">URL / Link</label>
          <input
            required
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://drive.google.com/..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/10 transition"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/10 transition appearance-none"
            >
              <option>General Study</option>
              <option>NCERT</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Biology</option>
              <option>Previous Year Papers</option>
              <option>Notes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Description</label>
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/10 transition"
            />
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="group relative w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-[#0B1120]/20 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#0B1120]/30 disabled:opacity-70 disabled:translate-y-0"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : status === "success" ? (
            <>
              <CheckCircle2 size={20} className="text-emerald-400" /> Success!
            </>
          ) : status === "error" ? (
            <>
              <XCircle size={20} className="text-rose-400" /> Failed
            </>
          ) : (
            <>
              <UploadCloud size={20} /> Share Now
            </>
          )}
        </button>
      </form>
    </div>
  );
}
