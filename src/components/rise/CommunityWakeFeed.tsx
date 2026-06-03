import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
type FilterMode = "global" | "city" | "nearby";
type ViewMode   = "feed" | "map";
type OwnState   = "woken" | "pending" | "no_alarm";

interface Waker {
  id: string;
  name: string;
  city: string;
  thana: string;
  wake_time: string;
  streak: number;
  alarm_label: string | null;
  is_anonymous: boolean;
  is_first_in_thana: boolean;
  distance_km: number | null;
  status_text?: string;
  is_live: boolean; // true = woke up within last 5 minutes
}

interface MyEvent {
  id: string;
  wake_time: string;
  city: string;
  streak: number;
  alarm_label: string | null;
  status_text: string;
  next_alarm_time?: string; // e.g. "৬:০০ AM" — for pending state
}

interface CommunitySettings {
  show_in_community: boolean;
  anonymous_mode: boolean;
  show_alarm_label: boolean;
  nearby_radius_km: number;
}

interface WeeklyRecapData {
  total_days: number;
  avg_wake_time: string;
  best_streak: number;
  current_streak: number;
  total_wakes: number;
}

// ═══════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════
const MOCK_WAKERS: Waker[] = [
  { id: "1", name: "Rafiq Ahmed",  city: "Dhaka",      thana: "Mirpur",      wake_time: "5:12 AM", streak: 14, alarm_label: "Fajr 🤲",  is_anonymous: false, is_first_in_thana: true,  distance_km: null, is_live: false },
  { id: "2", name: "Anonymous",    city: "Dhaka",      thana: "Gulshan",     wake_time: "5:34 AM", streak: 7,  alarm_label: "Gym 💪",    is_anonymous: true,  is_first_in_thana: false, distance_km: null, is_live: true  },
  { id: "3", name: "Sumaiya K.",   city: "Chittagong", thana: "Panchlaish",  wake_time: "5:47 AM", streak: 30, alarm_label: "Study 📚",  is_anonymous: false, is_first_in_thana: true,  distance_km: null, is_live: true  },
  { id: "4", name: "Anonymous",    city: "Dhaka",      thana: "Dhanmondi",   wake_time: "6:01 AM", streak: 3,  alarm_label: null,        is_anonymous: true,  is_first_in_thana: false, distance_km: 2.3,  is_live: false },
  { id: "5", name: "Imran H.",     city: "Sylhet",     thana: "Zindabazar",  wake_time: "6:15 AM", streak: 21, alarm_label: "Work 💼",   is_anonymous: false, is_first_in_thana: false, distance_km: null, is_live: false },
];

const MOCK_MY_EVENT: MyEvent = {
  id: "me",
  wake_time: "5:58 AM",
  city: "Dhaka",
  streak: 5,
  alarm_label: "Fajr 🤲",
  status_text: "",
  next_alarm_time: "৬:০০ AM",
};

const MOCK_RECAP: WeeklyRecapData = {
  total_days: 7,
  avg_wake_time: "5:52 AM",
  best_streak: 7,
  current_streak: 5,
  total_wakes: 7,
};

// Special days config — easy to update
const SPECIAL_DAYS: Record<string, { label: string; emoji: string; banner?: string }> = {
  "03-26": { label: "স্বাধীনতা দিবস",   emoji: "🇧🇩", banner: "আজ স্বাধীনতা দিবস — Rise এর সাথে উঠো!" },
  "12-16": { label: "বিজয় দিবস",        emoji: "🇧🇩", banner: "আজ বিজয় দিবস — Rise এর সাথে উঠো!" },
  "03-17": { label: "ঈদুল ফিতর",         emoji: "🌙",  banner: "ঈদ মুবারক! 🌙✨" },
};

// ═══════════════════════════════════════════════════════
// ICONS — inline SVG matching existing icon set
// ═══════════════════════════════════════════════════════
const PATHS = {
  Globe:    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.5 2.5-4 6-4 10s1.5 7.5 4 10m0-20c2.5 2.5 4 6 4 10s-1.5 7.5-4 10M2 12h20",
  City:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  MapPin:   "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
  List:     "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  Map:      "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zm7-4v16m8-12v16",
  Sunrise:  "M17 18a5 5 0 0 0-10 0M12 2v7M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1M16 5l-4 4-4-4",
  Settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  Eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  Shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  Tag:      "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  X:        "M18 6 6 18M6 6l12 12",
  BarChart: "M12 20V10M18 20V4M6 20v-4",
  Share:    "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  Moon:     "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  Bell:     "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
};

interface IconProps { d: string; size?: number; color?: string; strokeWidth?: number; }
const Ico = ({ d, size = 16, color = "currentColor", strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ═══════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════
function useCountUp(target: number, duration = 900): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// Detect Ramadan (simplified: real app uses Islamic calendar lib)
function useIsRamadan(): boolean {
  // Mock: return false for demo. Real: use 'hijri-date' npm package
  return false;
}

// Detect special day
function useSpecialDay(): { label: string; emoji: string; banner?: string } | null {
  const now = new Date();
  const key = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return SPECIAL_DAYS[key] ?? null;
}

// ═══════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6C63FF,#B47AFF)",
  "linear-gradient(135deg,#00C9A7,#0099FF)",
  "linear-gradient(135deg,#FFD740,#FF6B6B)",
  "linear-gradient(135deg,#FF6B6B,#FF9A9E)",
  "linear-gradient(135deg,#43E97B,#38F9D7)",
];

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const bg = AVATAR_GRADIENTS[initials.charCodeAt(0) % AVATAR_GRADIENTS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }}>
      {initials === "AN" ? "👤" : initials}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0, border: "none", cursor: "pointer",
        background: checked ? "#6C63FF" : "rgba(255,255,255,0.12)",
        boxShadow: checked ? "0 0 10px rgba(108,99,255,0.4)" : "none",
        position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: checked ? 22 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// STAT PILL (Hero Stats Bar)
// ═══════════════════════════════════════════════════════
function StatPill({ icon, count, label, active, onClick }: {
  icon: string; count: number; label: string; active: boolean; onClick: () => void;
}) {
  const animated = useCountUp(count);
  return (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      gap: 2, padding: "10px 8px", borderRadius: 14, cursor: "pointer", border: "none",
      background: active ? "rgba(108,99,255,0.18)" : "rgba(255,255,255,0.04)",
      outline: active ? "1px solid rgba(108,99,255,0.45)" : "1px solid rgba(255,255,255,0.07)",
      transition: "all 0.22s",
    }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{
        fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1,
        color: active ? "#fff" : "rgba(255,255,255,0.7)",
      }}>{animated.toLocaleString()}</span>
      <span style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
        {label}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// OWN STATUS CARD — 3 states
// ═══════════════════════════════════════════════════════
function OwnStatusCard({ state, event }: { state: OwnState; event: MyEvent | null }) {
  if (state === "woken" && event) return (
    <div style={{
      borderRadius: 18, padding: "16px 18px",
      background: "linear-gradient(135deg,rgba(108,99,255,0.12),rgba(0,230,118,0.06))",
      border: "1px solid rgba(108,99,255,0.25)", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", right: -20, top: -20, width: 80, height: 80,
        borderRadius: "50%", background: "rgba(108,99,255,0.15)",
        filter: "blur(24px)", pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14, fontSize: 20,
          background: "linear-gradient(135deg,#6C63FF,#00E676)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(108,99,255,0.35)",
        }}>✅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            তুমি আজ {event.wake_time} এ উঠেছো 🌅
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 13 }}>🔥</span>
            <span style={{ fontSize: 12, color: "#FFD740", fontWeight: 600 }}>{event.streak} day streak চলছে</span>
            {event.alarm_label && (
              <>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>•</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{event.alarm_label}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (state === "pending" && event) return (
    <div style={{
      borderRadius: 18, padding: "16px 18px",
      background: "linear-gradient(135deg,rgba(255,215,64,0.08),rgba(255,107,107,0.05))",
      border: "1px solid rgba(255,215,64,0.18)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14, fontSize: 22,
          background: "rgba(255,215,64,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>⏰</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>আজি এখনো ওঠোনি</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            অ্যালার্ম set আছে {event.next_alarm_time} এ
          </div>
        </div>
      </div>
    </div>
  );

  // no_alarm
  return (
    <div style={{
      borderRadius: 18, padding: "16px 18px",
      background: "rgba(17,17,24,1)", border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14, fontSize: 22,
          background: "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>😴</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>আজ কোনো অ্যালার্ম নেই</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>সকালে উঠতে একটা set করো</div>
        </div>
        <button style={{
          background: "#6C63FF", border: "none", borderRadius: 10,
          color: "#fff", fontSize: 11, fontWeight: 700, padding: "7px 12px",
          cursor: "pointer",
        }}>Set করো</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STATUS UPDATE BAR with label suggestions
// ═══════════════════════════════════════════════════════
const LABEL_SUGGESTIONS = [
  { label: "Fajr 🤲" },
  { label: "Gym 💪" },
  { label: "Study 📚" },
  { label: "Work 💼" },
  { label: "Walk 🌿" },
];

function StatusUpdateBar({ onSave }: { onSave: (text: string, emoji: string) => void }) {
  const [emoji, setEmoji] = useState("");
  const [text, setText] = useState("");
  return (
    <div style={{
      background: "rgba(17,17,24,1)", border: "1px solid rgba(108,99,255,0.2)",
      borderRadius: 16, padding: "12px 14px",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Status update করো</div>

      {/* Label suggestion chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 10 }}>
        {LABEL_SUGGESTIONS.map(s => (
          <button key={s.label} onClick={() => setText(s.label)} style={{
            padding: "4px 10px", borderRadius: 100, border: "none", cursor: "pointer",
            background: text === s.label ? "#6C63FF" : "rgba(255,255,255,0.07)",
            color: text === s.label ? "#fff" : "rgba(255,255,255,0.5)",
            fontSize: 11, fontWeight: 600, transition: "all 0.15s",
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2}
          placeholder="🕌"
          style={{
            width: 44, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, color: "#fff", fontSize: 18, textAlign: "center",
            outline: "none", padding: "8px 0", flexShrink: 0,
          }} />
        <input value={text} onChange={e => setText(e.target.value)} maxLength={60}
          placeholder="কী করছেন এখন? (max 60)"
          style={{
            flex: 1, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, color: "#fff", fontSize: 12, outline: "none",
            padding: "8px 12px",
          }} />
        <button onClick={() => text.trim() && onSave(text.trim(), emoji)} style={{
          background: "#6C63FF", border: "none", borderRadius: 10,
          color: "#fff", fontSize: 12, fontWeight: 700, padding: "0 14px",
          cursor: "pointer", flexShrink: 0,
          boxShadow: "0 2px 10px rgba(108,99,255,0.35)",
        }}>Save</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// WAKER CARD
// ═══════════════════════════════════════════════════════
function WakerCard({ waker, showDistance, isCurrentUser, showAlarmLabel }: {
  waker: Waker; showDistance: boolean; isCurrentUser: boolean; showAlarmLabel: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = waker.is_anonymous
    ? "AN"
    : waker.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      borderRadius: 16, padding: "13px 15px",
      background: isCurrentUser
        ? "linear-gradient(135deg,rgba(108,99,255,0.14),rgba(108,99,255,0.06))"
        : "rgba(17,17,24,1)",
      border: isCurrentUser
        ? "1px solid rgba(108,99,255,0.3)"
        : "1px solid rgba(255,255,255,0.055)",
      display: "flex", alignItems: "center", gap: 12,
      position: "relative",
    }}>
      {/* Avatar + badges */}
      <div style={{ position: "relative" }}>
        <Avatar initials={initials} size={40} />
        {/* Live breathing dot — top-right, visible when woke within 5 min */}
        {waker.is_live && (
          <div style={{
            position: "absolute", top: -2, right: -2,
            width: 11, height: 11, borderRadius: "50%",
            background: "#00E676", border: "2px solid #0A0A0F",
            animation: "breathe 1.8s ease-in-out infinite",
            boxShadow: "0 0 6px rgba(0,230,118,0.7)",
          }} />
        )}
        {waker.is_first_in_thana && (
          <div style={{
            position: "absolute", bottom: -3, right: -3,
            width: 16, height: 16, borderRadius: "50%",
            background: "#FFD740", border: "2px solid #0A0A0F",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8,
          }}>⭐</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: "#fff",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
          }}>
            {waker.is_anonymous ? "Anonymous" : waker.name}
          </span>
          {/* Live pill next to name */}
          {waker.is_live && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: "#00E676",
              background: "rgba(0,230,118,0.12)",
              border: "1px solid rgba(0,230,118,0.25)",
              padding: "1px 6px", borderRadius: 100, letterSpacing: "0.03em",
              flexShrink: 0,
            }}>● Live</span>
          )}
          {isCurrentUser && (
            <span style={{
              fontSize: 9, background: "#6C63FF", color: "#fff",
              padding: "1px 6px", borderRadius: 100, fontWeight: 700,
            }}>YOU</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" as const }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{waker.wake_time}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>•</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{waker.thana}, {waker.city}</span>
          {showDistance && waker.distance_km != null && (
            <>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>•</span>
              <span style={{ fontSize: 11, color: "#6C63FF", fontWeight: 600 }}>{waker.distance_km} km</span>
            </>
          )}
        </div>
        {showAlarmLabel && waker.alarm_label && (
          <div style={{ marginTop: 5 }}>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 100,
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>{waker.alarm_label}</span>
          </div>
        )}
      </div>

      {/* Streak + menu */}
      <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 12 }}>🔥</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FFD740" }}>{waker.streak}</span>
        </div>
        {!isCurrentUser && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.2)", fontSize: 16, padding: "2px 4px",
          }}>⋯</button>
        )}
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "absolute" as const, right: 12, top: 44, zIndex: 10,
            background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "6px 0", minWidth: 130,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
          <button style={{
            display: "block", width: "100%", textAlign: "left" as const,
            padding: "8px 14px", background: "none", border: "none",
            color: "#FF6B6B", fontSize: 12, cursor: "pointer",
          }}>🚩 Report</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MILESTONE BANNER — auto-dismiss 5s
// ═══════════════════════════════════════════════════════
function MilestoneBanner({ count }: { count: number }) {
  const [visible, setVisible] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => {
    const milestones = [100000, 10000, 1000, 100];
    const hit = milestones.find(m => count >= m);
    if (!hit) return;

    const key = `rise_milestone_${hit}_${new Date().toDateString()}`;
    if (localStorage.getItem(key)) return; // already shown today
    localStorage.setItem(key, "1");
    setMilestone(hit);
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 5000); // auto-dismiss 5s
    return () => clearTimeout(timer);
  }, [count]);

  if (!visible || !milestone) return null;

  return (
    <div style={{
      borderRadius: 16, padding: "12px 16px", marginBottom: 12,
      background: "linear-gradient(135deg,#6C63FF,#B47AFF)",
      boxShadow: "0 4px 20px rgba(108,99,255,0.45)",
      display: "flex", alignItems: "center", gap: 10,
      animation: "slideDown 0.4s ease",
    }}>
      <span style={{ fontSize: 20 }}>🎉</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
          আজ Rise এ {milestone.toLocaleString()} জন উঠেছে!
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>তুমিও এর একজন 🌅</div>
      </div>
      <button onClick={() => setVisible(false)} style={{
        background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
        width: 26, height: 26, cursor: "pointer", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Ico d={PATHS.X} size={13} /></button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SPECIAL DAY BANNER (Ramadan / Eid / National Day)
// ═══════════════════════════════════════════════════════
function SpecialDayBanner({ day, ramadanCount }: {
  day: { label: string; emoji: string; banner?: string } | null;
  ramadanCount?: number;
}) {
  const isRamadan = useIsRamadan();

  if (isRamadan) return (
    <div style={{
      borderRadius: 14, padding: "10px 14px", marginBottom: 10,
      background: "linear-gradient(135deg,rgba(255,215,64,0.1),rgba(108,99,255,0.08))",
      border: "1px solid rgba(255,215,64,0.2)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>🌙</span>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
        আজ Fajr এ <span style={{ color: "#FFD740", fontWeight: 700 }}>{ramadanCount ?? 247} জন</span> উঠেছে
      </div>
    </div>
  );

  if (!day) return null;
  return (
    <div style={{
      borderRadius: 14, padding: "10px 14px", marginBottom: 10,
      background: "linear-gradient(135deg,rgba(0,200,118,0.08),rgba(108,99,255,0.06))",
      border: "1px solid rgba(0,200,118,0.18)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>{day.emoji}</span>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
        {day.banner ?? `আজ ${day.label}`}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════
function EmptyState({ filterMode, onCity, onGlobal }: {
  filterMode: FilterMode; onCity: () => void; onGlobal: () => void;
}) {
  return (
    <div style={{
      borderRadius: 18, padding: "36px 24px",
      background: "rgba(17,17,24,1)", border: "1px solid rgba(255,255,255,0.05)",
      textAlign: "center" as const,
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🌙</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
        এখনো কেউ {filterMode === "nearby" ? "কাছে" : "এখানে"} নেই
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 18 }}>আপনিই প্রথম! 🎉</div>
      {filterMode !== "global" && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {filterMode === "nearby" && (
            <button onClick={onCity} style={{
              padding: "8px 16px", borderRadius: 10, cursor: "pointer",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff", fontSize: 12,
            }}>City দেখো</button>
          )}
          <button onClick={onGlobal} style={{
            padding: "8px 16px", borderRadius: 10, cursor: "pointer",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff", fontSize: 12,
          }}>Global দেখো</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAP PLACEHOLDER
// ═══════════════════════════════════════════════════════
function MapPlaceholder({ wakers }: { wakers: Waker[] }) {
  return (
    <div style={{
      borderRadius: 18, minHeight: 280,
      background: "rgba(17,17,24,1)", border: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column" as const,
      alignItems: "center", justifyContent: "center", gap: 14, padding: 24,
    }}>
      <div style={{ fontSize: 32 }}>🗺️</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Bangladesh Map</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" as const }}>
        {wakers.length} জন এখন active — BangladeshMapView component এখানে render হবে
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, justifyContent: "center" }}>
        {wakers.map((w, i) => (
          <div key={i} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `rgba(108,99,255,${0.25 + i * 0.12})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "#fff", fontWeight: 700,
            boxShadow: "0 0 10px rgba(108,99,255,0.35)",
          }}>{w.city[0]}</div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SETTINGS SHEET
// ═══════════════════════════════════════════════════════
interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  settings: CommunitySettings;
  onUpdate: (patch: Partial<CommunitySettings>) => void;
}
function SettingsSheet({ open, onClose, settings, onUpdate }: SettingsSheetProps) {
  if (!open) return null;
  const RADII = [{ v: 5, label: "5 km" }, { v: 10, label: "10 km" }, { v: 9999, label: "পুরো শহর" }];
  const rows: { key: keyof CommunitySettings; icon: string; title: string; sub: string }[] = [
    { key: "show_in_community", icon: PATHS.Eye,    title: "Community তে দেখাও",  sub: "OFF করলে feed এ দেখাবে না" },
    { key: "anonymous_mode",    icon: PATHS.Shield, title: "Anonymous mode",        sub: "OFF করলে নাম+ছবি দেখাবে (next wake থেকে)" },
    { key: "show_alarm_label",  icon: PATHS.Tag,    title: "Alarm label দেখাও",    sub: "কেন উঠছো — feed এ দেখাবে কিনা" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 430, margin: "0 auto",
        background: "#0A0A0F", borderRadius: "24px 24px 0 0",
        border: "1px solid rgba(255,255,255,0.08)", padding: "20px 20px 36px",
        maxHeight: "88vh", overflowY: "auto", animation: "slideUp 0.3s ease",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 20px" }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Community Settings</div>

        <div style={{ borderRadius: 16, background: "#111118", border: "1px solid rgba(255,255,255,0.06)", padding: "0 14px" }}>
          {rows.map((row, i) => (
            <div key={row.key} style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: 12, padding: "14px 0",
              borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ color: "rgba(255,255,255,0.45)", marginTop: 2 }}><Ico d={row.icon} size={15} /></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{row.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{row.sub}</div>
                </div>
              </div>
              <Toggle
                checked={settings[row.key] as boolean}
                onChange={v => onUpdate({ [row.key]: v })}
              />
            </div>
          ))}
        </div>

        <div style={{ borderRadius: 16, background: "#111118", border: "1px solid rgba(255,255,255,0.06)", padding: 14, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Ico d={PATHS.MapPin} size={14} color="rgba(255,255,255,0.5)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Nearby radius</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {RADII.map(r => {
              const active = settings.nearby_radius_km === r.v;
              return (
                <button key={r.v} onClick={() => onUpdate({ nearby_radius_km: r.v })} style={{
                  padding: "10px 0", borderRadius: 12, cursor: "pointer",
                  background: active ? "#6C63FF" : "rgba(0,0,0,0.3)",
                  border: active ? "1px solid rgba(108,99,255,0.5)" : "1px solid rgba(255,255,255,0.06)",
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: 12, fontWeight: 600, transition: "all 0.18s",
                  boxShadow: active ? "0 0 12px rgba(108,99,255,0.35)" : "none",
                }}>{r.label}</button>
              );
            })}
          </div>
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 20 }}>
          Changes apply instantly — কোনো save button লাগবে না।
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// WEEKLY RECAP SHEET
// ═══════════════════════════════════════════════════════
function WeeklyRecapSheet({ open, onClose, data }: {
  open: boolean; onClose: () => void; data: WeeklyRecapData | null;
}) {
  if (!open || !data) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 430, margin: "0 auto",
        background: "#0A0A0F", borderRadius: "24px 24px 0 0",
        border: "1px solid rgba(255,255,255,0.08)", padding: "20px 20px 40px",
        animation: "slideUp 0.3s ease",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Ico d={PATHS.BarChart} size={16} color="#6C63FF" />
          <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>এই সপ্তাহের Recap</span>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "মোট দিন উঠেছো",   value: `${data.total_wakes}/${data.total_days}`, emoji: "📅" },
            { label: "গড় ওঠার সময়",     value: data.avg_wake_time,                       emoji: "⏰" },
            { label: "সেরা streak",       value: `${data.best_streak} days`,               emoji: "🔥" },
            { label: "এখন streak",        value: `${data.current_streak} days`,            emoji: "⚡" },
          ].map(stat => (
            <div key={stat.label} style={{
              borderRadius: 14, padding: "14px",
              background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)",
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Share button */}
        <button style={{
          width: "100%", padding: "13px 0", borderRadius: 14,
          background: "linear-gradient(135deg,#6C63FF,#B47AFF)",
          border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 16px rgba(108,99,255,0.4)",
        }}>
          <Ico d={PATHS.Share} size={15} /> Share করো
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEARBY PERMISSION DIALOG
// ═══════════════════════════════════════════════════════
function NearbyDialog({ open, onAllow, onDeny }: {
  open: boolean; onAllow: () => void; onDeny: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onDeny} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }} />
      <div style={{
        position: "relative", background: "#0A0A0F", borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.1)", padding: 24, maxWidth: 340, width: "100%",
        animation: "fadeIn 0.25s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, fontSize: 16,
            background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Ico d={PATHS.MapPin} size={16} color="#00E676" /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>কাছের Wakers দেখবে?</div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, marginBottom: 20 }}>
          আপনার কাছের wakers দেখতে একবার location দরকার।
          আপনার exact location কখনো save হবে না — শুধু এলাকা।
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onDeny} style={{
            flex: 1, padding: "11px 0", borderRadius: 12, cursor: "pointer",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600,
          }}>এখন না</button>
          <button onClick={onAllow} style={{
            flex: 1, padding: "11px 0", borderRadius: 12, cursor: "pointer",
            background: "#6C63FF", border: "none", color: "#fff",
            fontSize: 13, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(108,99,255,0.4)",
          }}>অনুমতি দাও</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function CommunityWakeFeed() {
  const [filterMode, setFilterMode] = useState<FilterMode>("global");
  const [view, setView] = useState<ViewMode>("feed");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [nearbyPromptOpen, setNearbyPromptOpen] = useState(false);

  // Demo: toggle own state to show all 3 OwnStatusCard variants
  const [ownState, setOwnState] = useState<OwnState>("woken");

  const [settings, setSettings] = useState<CommunitySettings>({
    show_in_community: true,
    anonymous_mode: true,
    show_alarm_label: true,
    nearby_radius_km: 5,
  });

  const TOTAL  = 1247;
  const CITY   = 84;
  const NEARBY: number = 3;

  const specialDay = useSpecialDay();

  // Auto-fallback: if Nearby tab empty → City → Global
  useEffect(() => {
    if (filterMode === "nearby" && NEARBY === 0) {
      setFilterMode(CITY > 0 ? "city" : "global");
    }
  }, [filterMode]);

  const handleSelectFilter = useCallback((mode: FilterMode) => {
    if (mode === "nearby") {
      const asked = sessionStorage.getItem("rise_nearby_asked") === "1";
      if (!asked) { setNearbyPromptOpen(true); return; }
    }
    setFilterMode(mode);
  }, []);

  const updateSettings = useCallback((patch: Partial<CommunitySettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const tabStyle = (active: boolean) => ({
    flex: 1, display: "flex", alignItems: "center" as const, justifyContent: "center" as const,
    gap: 5, padding: "8px 0", borderRadius: 100, border: "none", cursor: "pointer" as const,
    background: active ? "#6C63FF" : "transparent",
    boxShadow: active ? "0 0 18px rgba(108,99,255,0.4)" : "none",
    color: active ? "#fff" : "rgba(255,255,255,0.45)",
    fontSize: 11, fontWeight: 600, transition: "all 0.2s",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07070D; font-family: 'DM Sans', sans-serif; }
        @keyframes slideDown { from { transform: translateY(-14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideUp   { from { transform: translateY(44px);  opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn    { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes breathe   { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.75); } }
        input::placeholder   { color: rgba(255,255,255,0.22); }
        input, button        { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar  { width: 0; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#07070D",
        fontFamily: "'DM Sans', sans-serif", color: "#fff",
        padding: "16px 16px 48px", maxWidth: 430, margin: "0 auto",
      }}>

        {/* ── Milestone Banner ── */}
        <MilestoneBanner count={TOTAL} />

        {/* ── Special Day / Ramadan Banner ── */}
        <SpecialDayBanner day={specialDay} ramadanCount={247} />

        {/* ── Header Card ── */}
        <div style={{
          borderRadius: 20, background: "#111118",
          border: "1px solid rgba(255,255,255,0.055)",
          padding: "16px 16px 14px", marginBottom: 10,
        }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ico d={PATHS.Sunrise} size={16} color="#FFD740" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>আজকের Wakers</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {/* Weekly Recap button */}
              <button onClick={() => setRecapOpen(true)} style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, width: 34, height: 34, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.5)",
              }}><Ico d={PATHS.BarChart} size={14} /></button>
              {/* Settings button */}
              <button onClick={() => setSettingsOpen(true)} style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, width: 34, height: 34, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.5)",
              }}><Ico d={PATHS.Settings} size={14} /></button>
            </div>
          </div>

          {/* Hero Stats Bar — show only if count > 0 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <StatPill icon="🌍" count={TOTAL}  label="Global" active={filterMode === "global"} onClick={() => handleSelectFilter("global")} />
            {CITY   > 0 && <StatPill icon="🏙️" count={CITY}   label="City"   active={filterMode === "city"}   onClick={() => handleSelectFilter("city")} />}
            {NEARBY > 0 && <StatPill icon="📍" count={NEARBY} label="Nearby" active={filterMode === "nearby"} onClick={() => handleSelectFilter("nearby")} />}
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, padding: "3px", background: "rgba(0,0,0,0.3)", borderRadius: 100 }}>
            {(["global", "city", "nearby"] as FilterMode[]).map(mode => (
              <button key={mode} onClick={() => handleSelectFilter(mode)} style={tabStyle(filterMode === mode)}>
                <Ico d={mode === "global" ? PATHS.Globe : mode === "city" ? PATHS.City : PATHS.MapPin} size={12} />
                {mode === "global" ? "Global" : mode === "city" ? "City" : "Nearby"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Demo state switcher (remove in production) ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["woken", "pending", "no_alarm"] as OwnState[]).map(s => (
            <button key={s} onClick={() => setOwnState(s)} style={{
              flex: 1, padding: "6px 0", borderRadius: 10, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: ownState === s ? "rgba(108,99,255,0.3)" : "rgba(255,255,255,0.05)",
              border: ownState === s ? "1px solid rgba(108,99,255,0.5)" : "1px solid rgba(255,255,255,0.07)",
              color: ownState === s ? "#fff" : "rgba(255,255,255,0.4)",
            }}>{s}</button>
          ))}
        </div>

        {/* ── Own Status Card — 3 states ── */}
        <div style={{ marginBottom: 10 }}>
          <OwnStatusCard state={ownState} event={MOCK_MY_EVENT} />
        </div>

        {/* ── Status Update Bar (only after woken) ── */}
        {ownState === "woken" && (
          <div style={{ marginBottom: 10 }}>
            <StatusUpdateBar onSave={(text, emoji) => console.log("status:", text, emoji)} />
          </div>
        )}

        {/* ── View Toggle ── */}
        <div style={{
          marginBottom: 12, background: "#111118",
          border: "1px solid rgba(255,255,255,0.055)", borderRadius: 100, padding: 4,
        }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["feed", "map"] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={tabStyle(view === v)}>
                <Ico d={v === "feed" ? PATHS.List : PATHS.Map} size={13} />
                {v === "feed" ? "Feed" : "Map"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {view === "map" ? (
          <MapPlaceholder wakers={MOCK_WAKERS} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_WAKERS.length === 0 ? (
              <EmptyState
                filterMode={filterMode}
                onCity={() => setFilterMode("city")}
                onGlobal={() => setFilterMode("global")}
              />
            ) : (
              MOCK_WAKERS.map(w => (
                <WakerCard
                  key={w.id}
                  waker={w}
                  showDistance={filterMode === "nearby"}
                  isCurrentUser={w.id === "me"}
                  showAlarmLabel={settings.show_alarm_label}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Sheets & Dialogs ── */}
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
      />
      <WeeklyRecapSheet
        open={recapOpen}
        onClose={() => setRecapOpen(false)}
        data={MOCK_RECAP}
      />
      <NearbyDialog
        open={nearbyPromptOpen}
        onAllow={() => {
          sessionStorage.setItem("rise_nearby_asked", "1");
          setNearbyPromptOpen(false);
          setFilterMode("nearby");
        }}
        onDeny={() => {
          sessionStorage.setItem("rise_nearby_asked", "1");
          setNearbyPromptOpen(false);
          setFilterMode(CITY > 0 ? "city" : "global");
        }}
      />
    </>
  );
}