import { useState, useEffect, useRef, useCallback } from "react";
import Shell from "./components/Shell";

// ── Types ──────────────────────────────────────────────────────────────────

interface Activity {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

type TimerState = "idle" | "running" | "paused" | "done";
type View = "focus" | "history";

interface Session {
  id: string;
  activityId: string;
  activityLabel: string;
  activityEmoji: string;
  minutes: number;
  completedAt: number;
}

// ── Constants ─────────────────────────────────────────────────────────────

const ACTIVITIES: Activity[] = [
  { id: "deep-work",  label: "Deep Work",  emoji: "💻", color: "#6366f1" },
  { id: "reading",    label: "Reading",    emoji: "📖", color: "#f59e0b" },
  { id: "meditation", label: "Meditation", emoji: "🧘", color: "#10b981" },
  { id: "writing",    label: "Writing",    emoji: "✍️",  color: "#ec4899" },
  { id: "studying",   label: "Studying",   emoji: "📚", color: "#3b82f6" },
  { id: "exercise",   label: "Exercise",   emoji: "🏋️",  color: "#ef4444" },
  { id: "planning",   label: "Planning",   emoji: "🗂️",  color: "#8b5cf6" },
  { id: "creative",   label: "Creative",   emoji: "🎨", color: "#f97316" },
];

const PRESETS = [5, 10, 15, 20, 25, 30, 45, 60];

const TRACKS = [
  { label: "🌧️ Rain",   src: "https://assets.mixkit.co/music/preview/mixkit-rain-and-thunder-ambience-1246.mp3" },
  { label: "🌲 Forest", src: "https://assets.mixkit.co/music/preview/mixkit-forest-birds-ambience-1210.mp3" },
  { label: "🌊 Ocean",  src: "https://assets.mixkit.co/music/preview/mixkit-ocean-waves-loop-1196.mp3" },
  { label: "🎵 Lofi",   src: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3" },
];

const STORAGE_SESSIONS = "focus_sessions_v2";

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }
function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView]             = useState<View>("focus");
  const [activity, setActivity]     = useState<Activity | null>(null);
  const [minutes, setMinutes]       = useState(25);
  const [customMin, setCustomMin]   = useState("");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [remaining, setRemaining]   = useState(25 * 60);
  const [musicOn, setMusicOn]       = useState(true);
  const [trackIdx, setTrackIdx]     = useState(0);
  const [volume, setVolume]         = useState(0.4);
  const [sessions, setSessions]     = useState<Session[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_SESSIONS) || "[]"); }
    catch { return []; }
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  // ── Audio ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const audio = new Audio(TRACKS[trackIdx].src);
    audio.loop   = true;
    audio.volume = volume;
    audioRef.current = audio;
    if (timerState === "running" && musicOn) audio.play().catch(() => {});
    return () => { audio.pause(); audio.src = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (timerState === "running" && musicOn) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [timerState, musicOn]);

  // ── Timer ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (timerState !== "running") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setTimerState("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  // Save session on done
  useEffect(() => {
    if (timerState === "done" && activity) {
      const s: Session = {
        id: genId(),
        activityId: activity.id,
        activityLabel: activity.label,
        activityEmoji: activity.emoji,
        minutes,
        completedAt: Date.now(),
      };
      setSessions((prev) => {
        const next = [s, ...prev].slice(0, 100);
        localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(next));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const selectMinutes = (m: number) => {
    setMinutes(m); setCustomMin("");
    if (timerState === "idle" || timerState === "done") setRemaining(m * 60);
  };

  const applyCustom = useCallback(() => {
    const m = parseInt(customMin, 10);
    if (!m || m < 1 || m > 180) return;
    setMinutes(m);
    if (timerState === "idle" || timerState === "done") setRemaining(m * 60);
  }, [customMin, timerState]);

  const handleStart = () => {
    if (!activity) return;
    if (timerState === "idle" || timerState === "done") setRemaining(minutes * 60);
    setTimerState("running");
  };

  const handlePause  = () => setTimerState("paused");
  const handleResume = () => setTimerState("running");
  const handleReset  = () => { setTimerState("idle"); setRemaining(minutes * 60); };

  const clearHistory = () => {
    setSessions([]);
    localStorage.removeItem(STORAGE_SESSIONS);
  };

  // ── Derived ───────────────────────────────────────────────────────────

  const total        = minutes * 60;
  const progress     = timerState === "idle" ? 0 : 1 - remaining / total;
  const circumference = 2 * Math.PI * 108;
  const accentColor  = activity?.color ?? "var(--accent)";
  const totalMinutes = sessions.reduce((a, s) => a + s.minutes, 0);

  // ── Nav ───────────────────────────────────────────────────────────────

  const navItems = [
    {
      id: "focus", label: "Focus", active: view === "focus",
      onClick: () => setView("focus"),
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>,
    },
    {
      id: "history", label: "History", active: view === "history",
      onClick: () => setView("history"),
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Shell appName="Focus" navItems={navItems}>
      {view === "focus" ? (
        <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-7">

          {/* Page title */}
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
              Focus
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {totalMinutes} min total
            </p>
          </div>

          {/* Activity picker */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              What are you focusing on?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITIES.map((a) => {
                const selected = activity?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => { if (timerState !== "running") setActivity(a); }}
                    className="flex flex-col items-center gap-1.5 py-3 px-1 transition-all"
                    style={{
                      borderRadius: "1.25rem",
                      border: `2px solid ${selected ? a.color : "var(--line)"}`,
                      background: selected ? a.color + "1a" : "var(--panel)",
                      opacity: timerState === "running" && !selected ? 0.35 : 1,
                      cursor: timerState === "running" ? "default" : "pointer",
                    }}
                  >
                    <span className="text-2xl leading-none">{a.emoji}</span>
                    <span className="text-xs font-semibold text-center leading-tight"
                      style={{ color: selected ? a.color : "var(--muted)" }}>
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Duration */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              Duration
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((m) => {
                const active = minutes === m && !customMin;
                return (
                  <button key={m} onClick={() => selectMinutes(m)}
                    disabled={timerState === "running"}
                    className="px-3 py-1.5 text-sm font-semibold transition-all"
                    style={{
                      borderRadius: "0.75rem",
                      background: active ? accentColor : "var(--panel)",
                      color: active ? "#fff" : "var(--muted)",
                      border: `1.5px solid ${active ? accentColor : "var(--line)"}`,
                      opacity: timerState === "running" ? 0.5 : 1,
                    }}>
                    {m}m
                  </button>
                );
              })}
              <div className="flex items-center gap-1">
                <input type="number" min={1} max={180} value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  onBlur={applyCustom}
                  onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                  disabled={timerState === "running"}
                  placeholder="?"
                  className="w-14 px-2 py-1.5 text-sm font-semibold text-center bg-transparent outline-none"
                  style={{
                    borderRadius: "0.75rem",
                    border: `1.5px solid ${customMin ? accentColor : "var(--line)"}`,
                    color: "var(--ink)", fontFamily: "Manrope, sans-serif",
                    opacity: timerState === "running" ? 0.5 : 1,
                  }} />
                <span className="text-sm" style={{ color: "var(--muted)" }}>m</span>
              </div>
            </div>
          </section>

          {/* Timer ring */}
          <section className="flex flex-col items-center gap-5">
            <div className="relative" style={{ width: 256, height: 256 }}>
              <svg width="256" height="256" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="128" cy="128" r="108" fill="none" stroke="var(--line)" strokeWidth="10" />
                <circle cx="128" cy="128" r="108" fill="none"
                  stroke={accentColor} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 0.9s ease, stroke 0.4s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {timerState === "done" ? (
                  <>
                    <span className="text-5xl mb-1">🎉</span>
                    <span className="text-xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
                      Well done!
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl font-bold tabular-nums"
                      style={{ fontFamily: "Fraunces, serif", color: "var(--ink)", letterSpacing: "-0.03em" }}>
                      {formatTime(remaining)}
                    </span>
                    <span className="text-sm mt-1.5" style={{ color: "var(--muted)" }}>
                      {activity ? `${activity.emoji} ${activity.label}` : "Pick an activity"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4">
              {timerState !== "idle" && (
                <button onClick={handleReset}
                  className="w-12 h-12 flex items-center justify-center transition-all"
                  style={{ borderRadius: "50%", background: "var(--panel)", border: "1.5px solid var(--line)", color: "var(--muted)" }}
                  aria-label="Reset">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}

              {timerState === "running" && (
                <button onClick={handlePause}
                  className="w-20 h-20 flex items-center justify-center shadow-lg transition-all"
                  style={{ borderRadius: "50%", background: accentColor, color: "#fff", border: "none" }}
                  aria-label="Pause">
                  <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                </button>
              )}
              {timerState === "paused" && (
                <button onClick={handleResume}
                  className="w-20 h-20 flex items-center justify-center shadow-lg transition-all"
                  style={{ borderRadius: "50%", background: accentColor, color: "#fff", border: "none" }}
                  aria-label="Resume">
                  <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}
              {timerState === "idle" && (
                <button onClick={handleStart} disabled={!activity}
                  className="w-20 h-20 flex items-center justify-center shadow-lg transition-all"
                  style={{
                    borderRadius: "50%",
                    background: activity ? accentColor : "var(--line)",
                    color: activity ? "#fff" : "var(--muted)",
                    border: "none",
                    cursor: activity ? "pointer" : "not-allowed",
                  }}
                  aria-label="Start">
                  <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}
              {timerState === "done" && (
                <button onClick={handleReset}
                  className="px-8 h-14 font-bold text-base shadow-lg transition-all"
                  style={{ borderRadius: "2rem", background: accentColor, color: "#fff", border: "none", fontFamily: "Manrope, sans-serif" }}>
                  Start Again
                </button>
              )}

              {/* Music toggle */}
              <button onClick={() => setMusicOn((v) => !v)}
                className="w-12 h-12 flex items-center justify-center transition-all"
                style={{
                  borderRadius: "50%",
                  background: musicOn ? "var(--accent)" : "var(--panel)",
                  border: `1.5px solid ${musicOn ? "var(--accent)" : "var(--line)"}`,
                  color: musicOn ? "#fff" : "var(--muted)",
                }}
                aria-label={musicOn ? "Mute music" : "Unmute music"}>
                {musicOn ? (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
            </div>
          </section>

          {/* Music panel */}
          <section className="p-4" style={{ background: "var(--panel)", border: "1.5px solid var(--line)", borderRadius: "1.25rem" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Ambient Sound
              </p>
              <span className="text-xs font-semibold px-2 py-0.5" style={{
                borderRadius: "0.5rem",
                background: musicOn ? "#10b98120" : "var(--line)",
                color: musicOn ? "#10b981" : "var(--muted)",
              }}>
                {musicOn ? "On" : "Off"}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              {TRACKS.map((t, i) => (
                <button key={t.label} onClick={() => { audioRef.current?.pause(); setTrackIdx(i); }}
                  className="px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    borderRadius: "0.75rem",
                    background: trackIdx === i ? "var(--accent)" : "var(--paper)",
                    color: trackIdx === i ? "#fff" : "var(--muted)",
                    border: `1.5px solid ${trackIdx === i ? "var(--accent)" : "var(--line)"}`,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                style={{ color: "var(--muted)", flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1" style={{ accentColor: "var(--accent)" }} />
              <span className="text-xs w-8 text-right" style={{ color: "var(--muted)" }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </section>

        </div>
      ) : (
        /* ── History view ── */
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
                History
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {totalMinutes} min focused
              </p>
            </div>
            {sessions.length > 0 && (
              <button onClick={clearHistory}
                className="px-4 py-1.5 text-sm font-semibold transition-all"
                style={{ borderRadius: "0.75rem", background: "transparent", color: "#ef4444", border: "1.5px solid #ef444440" }}>
                Clear all
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center" style={{ color: "var(--muted)" }}>
              <span className="text-6xl mb-4">🎯</span>
              <p className="text-lg font-semibold" style={{ fontFamily: "Fraunces, serif" }}>No sessions yet</p>
              <p className="text-sm mt-1">Complete a focus session to see it here.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {sessions.map((s) => {
                const act = ACTIVITIES.find((a) => a.id === s.activityId);
                const color = act?.color ?? "var(--accent)";
                const date = new Date(s.completedAt);
                const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                return (
                  <li key={s.id} className="flex items-center gap-4 px-5 py-4"
                    style={{ background: "var(--panel)", border: "1.5px solid var(--line)", borderRadius: "1.25rem" }}>
                    <span
                      className="w-11 h-11 flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ borderRadius: "0.75rem", background: color + "1a" }}>
                      {s.activityEmoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{s.activityLabel}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{dateStr} at {timeStr}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color }}>
                      {s.minutes}m
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Shell>
  );
}
