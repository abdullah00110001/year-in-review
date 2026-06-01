import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  show_mode: string;
  max_views: number | null;
  is_active: boolean;
}

const STORAGE_KEY = "announcement_views_v1";

function getViews(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveViews(v: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}

export default function AnnouncementPopup() {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  const evaluateAndShow = useCallback((a: Announcement, opts: { forceShow?: boolean } = {}) => {
    if (!a.is_active) return;
    const views = getViews();
    const seen = views[a.id] || 0;
    if (!opts.forceShow) {
      if (a.show_mode === "once" && seen >= 1) return;
      if (a.show_mode === "limited" && a.max_views != null && seen >= a.max_views) return;
    }
    setAnnouncement(a);
    views[a.id] = seen + 1;
    saveViews(views);
  }, []);

  // Initial fetch — latest active announcement on app open
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error || cancelled || !data || data.length === 0) return;
      evaluateAndShow(data[0] as Announcement);
    })();
    return () => {
      cancelled = true;
    };
  }, [evaluateAndShow, user]);

  // Live push — new/updated announcement → show immediately to logged-in users
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("announcements-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload) => {
          const a = payload.new as Announcement;
          // Force-show fresh broadcasts even if same id was previously viewed (admin re-push)
          evaluateAndShow(a, { forceShow: true });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "announcements" },
        (payload) => {
          const a = payload.new as Announcement;
          // If admin re-activates an announcement, show again
          if (a.is_active) evaluateAndShow(a, { forceShow: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [evaluateAndShow, user]);

  if (!user || !announcement) return null;

  const close = () => setAnnouncement(null);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background border border-border"
        >
          <X className="h-4 w-4" />
        </button>
        {announcement.image_url && (
          <img
            src={announcement.image_url}
            alt={announcement.title}
            className="w-full max-h-64 object-cover"
          />
        )}
        <div className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-foreground">{announcement.title}</h2>
          {announcement.body && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{announcement.body}</p>
          )}
          {announcement.link_url && (
            <Button
              className="w-full"
              onClick={() => {
                window.open(announcement.link_url!, "_blank", "noopener,noreferrer");
              }}
            >
              {announcement.button_text || "Learn More"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
