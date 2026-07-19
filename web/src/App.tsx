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

// ── Constants ─────────────────────────────────────────────────────────────

const ACTIVITIES: Activity[] = [
  { id: "deep-work",    label: "Deep Work",    emoji: "💻", color: "#6366f1" },
  { id: "reading",      label: "Reading",      emoji: "📖", color: "#f59e0b" },
  { id: "meditation",   label: "Meditation",   emoji: "🧘", color: "#10b981" },
  { id: "writing",      label: "Writing",      emoji: "✍️",  color: "#ec4899" },
  { id: "studying",     label: "Studying",     emoji: "📚", color: "#3b82f6" },
  { id: "exercise",     label: "Exercise",     emoji: "🏋️",  color: "#ef4444" },
  { id: "planning",     label: "Planning",     emoji: "🗂️",  color: "#8b5cf6" },
  { id: "creative",     label: "Creative",     emoji: "🎨", color: "#f97316" },
];

const PRESETS = [5, 10, 15, 20, 25, 30, 45, 60];

// Relaxing music tracks using publicly available ambient audio
const TRACKS = [
  { label: "Rain",        src: "https://assets.mixkit.co/music/preview/mixkit-rain-and-thunder-ambience-1246.mp3" },
  { label: "Forest",      src: "https://assets.mixkit.co/music/preview/mixkit-forest-birds-ambience-1210.mp3" },
  { label: "Ocean",       src: "https://assets.mixkit.co/music/preview/mixkit-ocean-waves-loop-1196.mp3" },
  { label: "Lofi",        src: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [activity, setActivity]     = useState<Activity | null>(null);
  const [minutes, setMinutes]       = useState(25);
  const [customMin, setCustomMin]   = useState("");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [remaining, setRemaining]   = useState(25 * 60);
  const [musicOn, setMusicOn]       = useState(true);
  const [trackIdx, setTrackIdx]     = useState(0);
  const [volume, setVolume]         = useState(0.4);
  const [sessions, setSessions]     = useState<number>(() => {
    return Number(localStorage.getItem("focus_sessions") || "0");
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  // ── Audio setup ────────────────────────────────────────────────────────

  useEffect(() => {
    const audio = new Audio(TRACKS[trackIdx].src);
    audio.loop   = true;
    audio.volume = volume;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (timerState === "running" && musicOn) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [timerState, musicOn]);

  // ── Timer logic ────────────────────────────────────────────────────────

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
          setSessions((s) => {
            const next = s + 1;
            localStorage.setItem("focus_sessions", String(next));
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const selectMinutes = useCallback((m: number) => {
    setMinutes(m);
    setCustomMin("");
    if (timerState === "idle" || timerState === "done") {
      setRemaining(m * 60);
    }
  }, [timerState]);

  const applyCustom = useCallback(() => {
    const m = parseInt(customMin, 10);
    if (!m || m < 1 || m > 180) return;
    setMinutes(m);
    if (timerState === "idle" || timerState === "done") {
      setRemaining(m * 60);
    }
  }, [customMin, timerState]);

  const handleStart = useCallback(() => {
    if (!activity) return;
    if (timerState === "idle" || timerState === "done") {
      setRemaining(minutes * 60);
    }
    setTimerState("running");
  }, [activity, timerState, minutes]);

  const handlePause = useCallback(() => setTimerState("paused"), []);
  const handleResume = useCallback(() => setTimerState("running"), []);

  const handleReset = useCallback(() => {
    setTimerState("idle");
    setRemaining(minutes * 60);
    audioRef.current?.pause();
  }, [minutes]);

  const handleTrackChange = useCallback((idx: number) => {
    audioRef.current?.pause();
    setTrackIdx(idx);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────

  const total    = minutes * 60;
  const progress = timerState === "idle" ? 0 : 1 - remaining / total;
  const circumference = 2 * Math.PI * 100;
  const currentActivity = activity ?? ACTIVITIES[0];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Shell appName="Focus">
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1
            className="text-4xl font-bold mb-1"
            style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
          >
            Focus
          </h1>
          <p style={{ color: "var(--muted)", fontFamily: "Manrope, sans-serif" }}>
            {sessions} session{sessions !== 1 ? "s" : ""} completed
          </p>
        </div>

        {/* Activity Picker */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            What are you focusing on?
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {ACTIVITIES.map((a) => (
              <button
                key={a.id}
                onClick={() => setActivity(a)}
                disabled={timerState === "running"}
                className="flex flex-col items-center gap-1.5 py-3 px-1 transition-all"
                style={{
                  borderRadius: "1.25rem",
                  border: `2px solid ${activity?.id === a.id ? a.color : "var(--line)"}`,
                  background: activity?.id === a.id ? a.color + "18" : "var(--panel)",
                  opacity: timerState === "running" && activity?.id !== a.id ? 0.4 : 1,
                }}
              >
                <span className="text-2xl leading-none">{a.emoji}</span>
                <span
                  className="text-xs font-semibold text-center leading-tight"
                  style={{ color: activity?.id === a.id ? a.color : "var(--muted)" }}
                >
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Duration Picker */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            Duration
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => selectMinutes(m)}
                disabled={timerState === "running"}
                className="px-3 py-1.5 text-sm font-semibold transition-all"
                style={{
                  borderRadius: "0.75rem",
                  background: minutes === m && !customMin ? "var(--accent)" : "var(--panel)",
                  color: minutes === m && !customMin ? "#fff" : "var(--muted)",
                  border: `1.5px solid ${minutes === m && !customMin ? "var(--accent)" : "var(--line)"}`,
                  opacity: timerState === "running" ? 0.5 : 1,
                }}
              >
                {m}m
              </button>
            ))}
            {/* Custom input */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={180}
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                onBlur={applyCustom}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                disabled={timerState === "running"}
                placeholder="?"
                className="w-14 px-2 py-1.5 text-sm font-semibold text-center bg-transparent outline-none"
                style={{
                  borderRadius: "0.75rem",
                  border: `1.5px solid ${customMin ? "var(--accent)" : "var(--line)"}`,
                  color: "var(--ink)",
                  fontFamily: "Manrope, sans-serif",
                  opacity: timerState === "running" ? 0.5 : 1,
                }}
              />
              <span className="text-sm" style={{ color: "var(--muted)" }}>m</span>
            </div>
          </div>
        </section>

        {/* Timer Ring */}
        <section className="flex flex-col items-center gap-6">
          <div className="relative" style={{ width: 240, height: 240 }}>
            <svg width="240" height="240" style={{ transform: "rotate(-90deg)" }}>
              {/* Track */}
              <circle
                cx="120" cy="120" r="100"
                fill="none"
                stroke="var(--line)"
                strokeWidth="10"
              />
              {/* Progress */}
              <circle
                cx="120" cy="120" r="100"
                fill="none"
                stroke={activity ? currentActivity.color : "var(--accent)"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            {/* Center content */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              {timerState === "done" ? (
                <>
                  <span className="text-5xl mb-1">🎉</span>
                  <span className="text-lg font-bold" style={{ color: "var(--ink)" }}>Done!</span>
                </>
              ) : (
                <>
                  <span className="text-5xl font-bold tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}>
                    {formatTime(remaining)}
                  </span>
                  {activity && (
                    <span className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                      {activity.emoji} {activity.label}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Reset */}
            {timerState !== "idle" && (
              <button
                onClick={handleReset}
                className="w-12 h-12 flex items-center justify-center transition-all"
                style={{
                  borderRadius: "50%",
                  background: "var(--panel)",
                  border: "1.5px solid var(--line)",
                  color: "var(--muted)",
                }}
                aria-label="Reset"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            {/* Play / Pause */}
            {timerState === "running" ? (
              <button
                onClick={handlePause}
                className="w-20 h-20 flex items-center justify-center transition-all shadow-lg"
                style={{
                  borderRadius: "50%",
                  background: activity?.color ?? "var(--accent)",
                  color: "#fff",
                  border: "none",
                }}
                aria-label="Pause"
              >
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            ) : timerState === "paused" ? (
              <button
                onClick={handleResume}
                className="w-20 h-20 flex items-center justify-center transition-all shadow-lg"
                style={{
                  borderRadius: "50%",
                  background: activity?.color ?? "var(--accent)",
                  color: "#fff",
                  border: "none",
                }}
                aria-label="Resume"
              >
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : timerState === "done" ? (
              <button
                onClick={handleReset}
                className="px-8 h-14 font-bold text-base transition-all shadow-lg"
                style={{
                  borderRadius: "2rem",
                  background: activity?.color ?? "var(--accent)",
                  color: "#fff",
                  border: "none",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Start Again
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={!activity}
                className="w-20 h-20 flex items-center justify-center transition-all shadow-lg"
                style={{
                  borderRadius: "50%",
                  background: activity ? (activity.color) : "var(--line)",
                  color: activity ? "#fff" : "var(--muted)",
                  border: "none",
                  cursor: activity ? "pointer" : "not-allowed",
                }}
                aria-label="Start"
              >
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}

            {/* Music toggle */}
            <button
              onClick={() => setMusicOn((v) => !v)}
              className="w-12 h-12 flex items-center justify-center transition-all"
              style={{
                borderRadius: "50%",
                background: musicOn ? "var(--accent)" : "var(--panel)",
                border: `1.5px solid ${musicOn ? "var(--accent)" : "var(--line)"}`,
                color: musicOn ? "#fff" : "var(--muted)",
              }}
              aria-label={musicOn ? "Mute music" : "Play music"}
            >
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

          {!activity && timerState === "idle" && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              ☝️ Pick an activity above to get started
            </p>
          )}
        </section>

        {/* Music Controls */}
        <section
          className="p-4"
          style={{
            background: "var(--panel)",
            border: "1.5px solid var(--line)",
            borderRadius: "1.25rem",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Ambient Sound
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5"
              style={{
                borderRadius: "0.5rem",
                background: musicOn ? "#10b98120" : "var(--line)",
                color: musicOn ? "#10b981" : "var(--muted)",
              }}
            >
              {musicOn ? "On" : "Off"}
            </span>
          </div>

          {/* Track selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {TRACKS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => handleTrackChange(i)}
                className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  borderRadius: "0.75rem",
                  background: trackIdx === i ? "var(--accent)" : "var(--paper)",
                  color: trackIdx === i ? "#fff" : "var(--muted)",
                  border: `1.5px solid ${trackIdx === i ? "var(--accent)" : "var(--line)"}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted)", flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
              style={{ accentColor: "var(--accent)" }}
            />
            <span className="text-xs w-8 text-right" style={{ color: "var(--muted)" }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </section>

      </div>
    </Shell>
  );
}
