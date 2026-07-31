import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardPlus,
  MapPinned,
  Megaphone,
  Truck,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FadeIn } from "@/components/magic/effects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dailyCheckin, fetchProfile, GameProfile } from "@/lib/gamification";
import { urgencyColor } from "@/lib/sentiment";

type Stats = {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  critical: number;
  high: number;
};

type Complaint = {
  id: number;
  description: string;
  status: string;
  urgency: string;
  created_at: string;
};

export function HomePage() {
  const { user } = useAuth();
  const [game, setGame] = useState<GameProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Complaint[]>([]);

  useEffect(() => {
    api<Stats>("/api/complaints/stats").then(setStats).catch(() => undefined);
    api<Complaint[]>("/api/complaints/")
      .then((rows) => setRecent(rows.slice(0, 5)))
      .catch(() => undefined);
    if (user?.role === "citizen" || user?.role === "driver") {
      dailyCheckin().finally(() => fetchProfile().then(setGame));
    }
  }, [user?.role]);

  const actions = [
    {
      title: "Report an issue",
      desc: "Photo + auto GPS + urgency from your words",
      to: "/app/complaints",
      icon: ClipboardPlus,
      roles: ["citizen", "driver"],
    },
    {
      title: "Review queue",
      desc: "Prioritize critical & high urgency complaints",
      to: "/app/complaints",
      icon: AlertTriangle,
      roles: ["officer", "admin"],
    },
    {
      title: "Share live GPS",
      desc: "Stream phone location while on route",
      to: "/app/track",
      icon: Truck,
      roles: ["driver"],
    },
    {
      title: "Live fleet map",
      desc: "See every truck move — even tiny GPS changes",
      to: "/app/fleet",
      icon: MapPinned,
      roles: ["citizen", "driver", "officer", "admin"],
    },
    {
      title: "Cleanliness drives",
      desc: "Volunteer · attendance · certificates",
      to: "/app/drives",
      icon: Megaphone,
      roles: ["citizen", "driver", "officer", "admin"],
    },
    {
      title: "Rewards & XP",
      desc: "Badges, missions, store — citizens & workers only",
      to: "/app/rewards",
      icon: Trophy,
      roles: ["citizen", "driver"],
    },
  ].filter((c) => user && c.roles.includes(user.role));

  return (
    <div className="space-y-8">
      <FadeIn>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Mission control</p>
        <h1 className="font-display text-4xl font-bold md:text-5xl">
          {user?.full_name}
          <span className="mt-1 block text-xl font-medium capitalize text-muted-foreground md:text-2xl">
            {user?.role} dashboard
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {user?.role === "officer" || user?.role === "admin"
            ? "Review complaints, verify urgency, assign field workers, and monitor live fleet."
            : "Report issues, track status, join drives, and climb the cleanliness leaderboard."}
        </p>
        {game && (
          <div className="mt-4 inline-flex flex-wrap gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm shadow-sm">
            <Badge variant="accent" className="capitalize">
              {game.tier}
            </Badge>
            <span>Lv {game.level}</span>
            <span className="text-muted-foreground">·</span>
            <span className="tabular">{game.xp} XP</span>
            <span className="text-muted-foreground">·</span>
            <span className="tabular">{game.points} pts</span>
            <span className="text-muted-foreground">·</span>
            <span>streak {game.daily_streak}d</span>
          </div>
        )}
      </FadeIn>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ClipboardPlus} label="Total" value={stats.total} />
          <StatCard icon={Clock} label="Pending" value={stats.pending} />
          <StatCard icon={AlertTriangle} label="Critical / High" value={stats.critical + stats.high} />
          <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="font-display text-xl font-semibold">Quick actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {actions.map((c, i) => (
              <FadeIn key={c.to + c.title} delay={0.05 * i}>
                <Link
                  to={c.to}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="font-display text-lg font-semibold">{c.title}</div>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-saffron opacity-80 transition group-hover:opacity-100">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Recent complaints</h2>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="space-y-3">
              {recent.length === 0 && <p className="text-sm text-muted-foreground">No complaints yet.</p>}
              {recent.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${urgencyColor(c.urgency || "medium")}`}>
                      {c.urgency || "medium"}
                    </span>
                    <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] capitalize text-sky-700 dark:text-sky-300">
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2">{c.description}</p>
                </div>
              ))}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/app/complaints">Full history</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="font-display text-2xl font-bold tabular">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
