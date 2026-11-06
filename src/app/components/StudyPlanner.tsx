"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Scene4D from "./Scene4D";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle2,
  Circle,
  Timer,
  BookOpen,
  Target,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
} from "lucide-react";

const chartData = [
  { day: "Mon", tasks: 4, completed: 3 },
  { day: "Tue", tasks: 6, completed: 5 },
  { day: "Wed", tasks: 5, completed: 4 },
  { day: "Thu", tasks: 7, completed: 6 },
  { day: "Fri", tasks: 4, completed: 3 },
  { day: "Sat", tasks: 8, completed: 6 },
  { day: "Sun", tasks: 3, completed: 3 },
];

export default function StudyPlanner() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [dailyTitle, setDailyTitle] = useState("");
  const [pendingTitle, setPendingTitle] = useState("");
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    fetch("/api/planner")
      .then((r) => r.json())
      .then(({ tasks }) => {
        if (tasks.length === 0) {
          setDailyTasks([
            { id: 1, text: "Complete NCERT Physics Chapter 4", done: true },
            { id: 2, text: "Write Math Notes — Quadratic Equations", done: false },
            { id: 3, text: "Revise Chemistry Organic Slides", done: false },
          ]);
          setPendingTasks([
            { id: 1, text: "Download Previous Year Papers", done: false },
            { id: 2, text: "Prepare 3D Model for Project", done: false },
            { id: 3, text: "Share Resources Link with Batch", done: true },
          ]);
        } else {
          const d = tasks.slice(0, 3).map((t: any) => ({
            id: t.id,
            text: t.title,
            done: t.status === "done",
          }));
          const p = tasks.slice(3, 6).map((t: any) => ({
            id: t.id,
            text: t.title,
            done: t.status === "done",
          }));
          setDailyTasks(d);
          setPendingTasks(p);
        }
      })
      .catch(() => {
        setDailyTasks([
          { id: 1, text: "Complete NCERT Physics Chapter 4", done: true },
          { id: 2, text: "Write Math Notes — Quadratic Equations", done: false },
          { id: 3, text: "Revise Chemistry Organic Slides", done: false },
        ]);
        setPendingTasks([
          { id: 1, text: "Download Previous Year Papers", done: false },
          { id: 2, text: "Prepare 3D Model for Project", done: false },
          { id: 3, text: "Share Resources Link with Batch", done: true },
        ]);
      });
  }, []);

  const toggleTimer = () => setRunning((r) => !r);
  const resetTimer = () => {
    setRunning(false);
    setTime(0);
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const addDaily = useCallback(() => {
    if (!dailyTitle.trim()) return;
    fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: dailyTitle.trim(), status: "done" }),
    })
      .then(() => {
        setDailyTasks((prev) => [
          ...prev,
          { id: Date.now(), text: dailyTitle.trim(), done: false },
        ]);
      })
      .catch(() => {
        setDailyTasks((prev) => [
          ...prev,
          { id: Date.now(), text: dailyTitle.trim(), done: false },
        ]);
      });
    setDailyTitle("");
  }, [dailyTitle]);

  const addPending = useCallback(() => {
    if (!pendingTitle.trim()) return;
    fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: pendingTitle.trim(), status: "pending" }),
    })
      .then(() => {})
      .catch(() => {});
    setPendingTasks((prev) => [
      ...prev,
      { id: Date.now(), text: pendingTitle.trim(), done: false },
    ]);
    setPendingTitle("");
  }, [pendingTitle]);

  const toggleDaily = (id: number) =>
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  const togglePending = (id: number) =>
    setPendingTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  return (
    <section
      id="planner"
      className="relative overflow-hidden bg-[#050a18] text-[#FDF8F3]"
      style={{ perspective: 1400 }}
    >
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] h-[700px] w-[700px] rounded-full bg-amber-400/15 blur-[160px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-sky-400/15 blur-[160px]" />
        <div className="absolute top-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-rose-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-300 backdrop-blur-sm shadow-lg shadow-amber-400/10">
            <Sparkles size={16} /> Study Tools
          </span>
          <h2
            className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg"
            style={{ textShadow: "0 20px 60px rgba(245,158,11,0.3)" }}
          >
            3D Study Planner{" "}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-200 drop-shadow-md">
              Graphs, Charts & More
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300 leading-relaxed">
            Track your daily progress with interactive charts, a precise study
            stopwatch, and organized task lists designed for serious students.
          </p>
        </div>

        {/* 4D Background Scene */}
        <Scene4D />
        {/* Depth vignette overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#050a18]/60 via-transparent to-[#050a18]/90 z-[5]" />

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8 relative z-10" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-8">
            {/* Background decorative ribbon */}
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-400/10 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-sky-400/10 blur-[80px] pointer-events-none" />

            {/* Stats cards — 3D card deck */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Weekly Tasks", value: "37", icon: BookOpen, hue: "amber" },
                { label: "Completed", value: "30", icon: CheckCircle2, hue: "emerald" },
                { label: "Study Hours", value: "21.5", icon: Clock, hue: "sky" },
                { label: "Focus Score", value: "92%", icon: TrendingUp, hue: "rose" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-700 hover:-translate-y-3 hover:rotate-[1deg] hover:shadow-[0_30px_60px_rgba(245,158,11,0.2),0_0_40px_rgba(245,158,11,0.1)] hover:-rotate-y-3"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${i * 2}deg) rotateY(${i * 1.5}deg) translateZ(10px)`,
                  }}
                >
                  {/* Glass edge highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300/30 to-amber-600/20 text-amber-200 shadow-inner shadow-amber-400/20 ring-1 ring-white/10 backdrop-blur-sm transition group-hover:scale-110 group-hover:shadow-amber-400/40">
                    <s.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] leading-none">{s.value}</div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Chart — 3D floating card */}
            <div
              className="relative rounded-3xl border border-white/[0.1] bg-gradient-to-b from-white/[0.1] to-white/[0.03] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl ring-1 ring-white/[0.08] overflow-hidden"
              style={{
                transform: "rotateX(1deg) rotateY(-0.5deg) translateZ(15px)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Inner glow at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-400/15 to-transparent pointer-events-none rounded-b-3xl" />
              <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-300/10 blur-[60px] pointer-events-none" />

              <div className="mb-6 flex items-center justify-between relative z-10">
                <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 drop-shadow-lg">
                  <Zap size={22} className="text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]" /> Weekly Productivity
                </h3>
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-extrabold text-amber-300 ring-1 ring-amber-400/20">
                  Last 7 Days
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    barGap={8}
                    onMouseMove={(state: any) => {
                      if (state && state.activePayload) {
                        setHoveredDay(state.activePayload[0]?.payload?.day ?? null);
                      }
                    }}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(11,17,32,0.98)",
                        color: "#fff",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.2)",
                        padding: "16px 20px",
                        fontSize: "14px",
                      }}
                      cursor={{ fill: "rgba(255,255,255,0.06)" }}
                      labelFormatter={(label: any) => (
                        <span className="font-extrabold text-amber-200">{String(label)}</span>
                      )}
                    />
                    <Bar dataKey="tasks" radius={[10, 10, 0, 0]} maxBarSize={40}>
                      {chartData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={
                            hoveredDay === d.day
                              ? "#fef08a"
                              : i % 2 === 0
                              ? "#f59e0b"
                              : "#fb923c"
                          }
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="completed" radius={[10, 10, 0, 0]} maxBarSize={40}>
                      {chartData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={
                            hoveredDay === d.day
                              ? "#7dd3fc"
                              : i % 2 === 0
                              ? "#0ea5e9"
                              : "#38bdf8"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex gap-6 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)] bg-amber-400" />{" "}
                  Tasks Planned
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)] bg-sky-400" />{" "}
                  Completed
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 space-y-8">
            {/* Stopwatch — 3D floating cylinder card */}
            <div
              className="relative overflow-hidden rounded-[2.5rem] border border-amber-400/20 bg-gradient-to-b from-amber-900/40 via-[#0B1120] to-[#0B1120] p-10 shadow-[0_50px_100px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
              style={{
                transform: "rotateX(-2deg) rotateY(1.5deg) translateZ(20px)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Cylindrical inner glow */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-400/10 via-transparent to-sky-400/10 rounded-[2.5rem]" />
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-400/20 blur-[80px]" />

              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2 text-amber-300">
                  <Timer size={18} />
                  <span className="text-xs font-extrabold uppercase tracking-[0.2em]">Focus Timer</span>
                </div>
                <div
                  className="mb-6 text-7xl font-extrabold tabular-nums tracking-tighter text-white leading-none relative"
                  style={{
                    textShadow: "0 0 60px rgba(245,158,11,0.5), 0 10px 40px rgba(245,158,11,0.3), 0 2px 6px rgba(0,0,0,0.4)",
                  }}
                >
                  {fmt(time)}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={toggleTimer}
                    aria-label={running ? "Pause" : "Start"}
                    className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-7 py-4 text-base font-extrabold text-[#0B1120] shadow-[0_15px_40px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-white/30 transition hover:-translate-y-1.5 hover:shadow-[0_25px_60px_rgba(245,158,11,0.7),inset_0_1px_0_rgba(255,255,255,0.4)] active:translate-y-0 active:shadow-[0_5px_20px_rgba(245,158,11,0.4)]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-200/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    {running ? <Pause size={22} /> : <Play size={22} />}
                    {running ? "Pause" : "Start"}
                  </button>
                  <button
                    onClick={resetTimer}
                    aria-label="Reset"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/15 hover:border-white/25 active:translate-y-0 shadow-inner shadow-white/5"
                  >
                    <RotateCcw size={18} /> Reset
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm font-medium text-slate-300 backdrop-blur-sm shadow-inner shadow-black/20">
                  <Zap size={18} className="text-amber-300" />
                  Aim for 25-minute Pomodoro cycles to maximize retention.
                </div>
              </div>
            </div>

            {/* Daily Tasks — 3D card */}
            <div
              className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/[0.05]"
              style={{ transform: "rotateX(1deg) rotateY(-0.5deg)", transformStyle: "preserve-3d" }}
            >
              <h3 className="mb-5 flex items-center gap-2 text-xl font-extrabold text-white tracking-tight">
                <BookOpen size={22} className="text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Daily Tasks
              </h3>
              <div className="mb-4 flex gap-2">
                <input
                  value={dailyTitle}
                  onChange={(e) => setDailyTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDaily()}
                  placeholder="Add today's task..."
                  className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition shadow-inner shadow-black/10"
                />
                <button
                  onClick={addDaily}
                  aria-label="Add daily task"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-3 py-3 text-[#0B1120] shadow-lg shadow-amber-400/20 transition hover:-translate-y-0.5 hover:shadow-amber-400/40 active:translate-y-0"
                >
                  <Plus size={20} />
                </button>
              </div>
              <ul className="space-y-2">
                {dailyTasks.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => toggleDaily(t.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                        t.done
                          ? "border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-amber-600/10 text-amber-100 line-through opacity-80 shadow-[inset_0_1px_0_rgba(245,158,11,0.1)]"
                          : "border-white/[0.1] bg-white/[0.05] text-slate-200 hover:bg-white/[0.1] hover:border-white/25 hover:-translate-y-0.5 shadow-inner shadow-black/5"
                      }`}
                    >
                      {t.done ? (
                        <CheckCircle2 size={18} className="shrink-0 text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                      ) : (
                        <Circle size={18} className="shrink-0 text-slate-500" />
                      )}
                      <span>{t.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pending Tasks — 3D card */}
            <div
              className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/[0.05]"
              style={{ transform: "rotateX(-0.5deg) rotateY(0.8deg)", transformStyle: "preserve-3d" }}
            >
              <h3 className="mb-5 flex items-center gap-2 text-xl font-extrabold text-white tracking-tight">
                <Target size={22} className="text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" /> Pending Tasks
              </h3>
              <div className="mb-4 flex gap-2">
                <input
                  value={pendingTitle}
                  onChange={(e) => setPendingTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPending()}
                  placeholder="Add a pending goal..."
                  className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition shadow-inner shadow-black/10"
                />
                <button
                  onClick={addPending}
                  aria-label="Add pending task"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 px-3 py-3 text-white shadow-lg shadow-sky-400/25 transition hover:-translate-y-0.5 hover:shadow-sky-400/50 active:translate-y-0"
                >
                  <Plus size={20} />
                </button>
              </div>
              <ul className="space-y-2">
                {pendingTasks.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => togglePending(t.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                        t.done
                          ? "border-sky-400/30 bg-gradient-to-r from-sky-400/10 to-blue-600/10 text-sky-200 line-through opacity-80 shadow-[inset_0_1px_0_rgba(56,189,248,0.1)]"
                          : "border-white/[0.1] bg-white/[0.05] text-slate-200 hover:bg-white/[0.1] hover:border-white/25 hover:-translate-y-0.5 shadow-inner shadow-black/5"
                      }`}
                    >
                      {t.done ? (
                        <CheckCircle2 size={18} className="shrink-0 text-sky-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
                      ) : (
                        <Circle size={18} className="shrink-0 text-slate-500" />
                      )}
                      <span>{t.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
