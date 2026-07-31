import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  AwardResult,
  GameProfile,
  dailyCheckin,
  fetchProfile,
} from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, GradientText, ShimmerButton } from "@/components/magic/effects";

type Badge = {
  code: string;
  name: string;
  description: string;
  icon: string;
  bonus_xp: number;
  earned: boolean;
};

type Mission = {
  code: string;
  title: string;
  description: string;
  period: string;
  target_count: number;
  reward_xp: number;
  progress: number;
  completed: boolean;
};

type Challenge = {
  code: string;
  title: string;
  description: string;
  scope: string;
  reward_xp: number;
  ends_at: string;
};

type StoreItem = {
  id: number;
  code: string;
  name: string;
  description: string;
  cost_points: number;
  item_type: string;
  stock: number;
};

type LB = {
  rank: number;
  display_name: string;
  role: string;
  ward: string;
  xp: number;
  level: number;
  tier: string;
};

type WardLB = {
  rank: number;
  ward: string;
  total_xp: number;
  citizen_count: number;
  cleanliness_score: number;
};

type Notif = {
  id: number;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  created_at: string;
};

const tabs = ["Overview", "Badges", "Missions", "Store", "Leaderboard", "Alerts"] as const;

export function RewardsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [store, setStore] = useState<StoreItem[]>([]);
  const [leaders, setLeaders] = useState<LB[]>([]);
  const [wards, setWards] = useState<WardLB[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const [p, b, m, c, s, l, w, n] = await Promise.all([
      fetchProfile(),
      api<Badge[]>("/api/gamification/badges"),
      api<Mission[]>("/api/gamification/missions"),
      api<Challenge[]>("/api/gamification/challenges"),
      api<StoreItem[]>("/api/gamification/store"),
      api<LB[]>("/api/gamification/leaderboard?scope=city"),
      api<WardLB[]>("/api/gamification/leaderboard/wards"),
      api<Notif[]>("/api/gamification/notifications"),
    ]);
    setProfile(p);
    setBadges(b);
    setMissions(m);
    setChallenges(c);
    setStore(s);
    setLeaders(l);
    setWards(w);
    setNotifs(n);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  async function checkin() {
    const res: AwardResult | null = await dailyCheckin();
    if (!res) return;
    setToast(res.awarded ? `+${res.xp_gained} XP · streak updated` : res.message);
    await refresh();
  }

  async function redeem(code: string) {
    try {
      const r = await api<{ code_issued: string }>("/api/gamification/store/redeem", {
        method: "POST",
        body: JSON.stringify({ item_code: code }),
      });
      setToast(`Redeemed! Code: ${r.code_issued}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Redeem failed");
    }
  }

  const progressPct = profile
    ? Math.min(
        100,
        Math.round(
          (profile.xp / Math.max(profile.xp + profile.xp_to_next_level, 1)) * 100,
        ),
      )
    : 0;

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-semibold">
          <GradientText>Rewards & Gamification</GradientText>
        </h1>
        <p className="text-muted-foreground">
          XP, levels, badges, missions, ward competitions, and a reward store — keep cleaning, keep climbing.
        </p>
      </FadeIn>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              tab === t
                ? "bg-primary text-primary-foreground shadow"
                : "bg-white/70 text-muted-foreground ring-1 ring-border hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          {toast}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {tab === "Overview" && profile && (
        <FadeIn>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2 overflow-hidden border-emerald-900/10 bg-gradient-to-br from-white/90 to-emerald-50/80">
              <CardHeader>
                <CardTitle className="text-xl">{profile.display_name}</CardTitle>
                <CardDescription className="capitalize">
                  {profile.tier} · Level {profile.level} · {profile.ward}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <Stat label="XP" value={profile.xp} />
                  <Stat label="Points" value={profile.points} />
                  <Stat label="Daily streak" value={profile.daily_streak} />
                  <Stat label="Weekly streak" value={profile.weekly_streak} />
                  <Stat label="Badges" value={profile.badges_count} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Level {profile.level}</span>
                    <span>{profile.xp_to_next_level} XP to next</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-amber-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {["beginner", "contributor", "champion", "hero", "legend"].map((t) => (
                    <span
                      key={t}
                      className={`rounded-full px-2 py-1 capitalize ${
                        profile.tier === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <ShimmerButton type="button" onClick={checkin}>
                  Claim daily login (+5 XP)
                </ShimmerButton>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active challenges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {challenges.map((c) => (
                  <div key={c.code} className="rounded-lg bg-secondary/60 p-3">
                    <div className="font-medium">{c.title}</div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <p className="mt-1 text-xs">
                      {c.scope} · +{c.reward_xp} XP · ends {new Date(c.ends_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      )}

      {tab === "Badges" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <Card
              key={b.code}
              className={b.earned ? "border-amber-300/60 bg-amber-50/50" : "opacity-70"}
            >
              <CardContent className="p-5">
                <div className="text-3xl">{b.icon}</div>
                <div className="mt-2 font-display text-lg font-semibold">{b.name}</div>
                <p className="text-sm text-muted-foreground">{b.description}</p>
                <p className="mt-2 text-xs">
                  {b.earned ? "Unlocked" : "Locked"} · Bonus +{b.bonus_xp} XP
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "Missions" && (
        <div className="grid gap-3">
          {missions.map((m) => (
            <Card key={m.code}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-medium">{m.title}</div>
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                  <p className="mt-1 text-xs capitalize">
                    {m.period} · {m.progress}/{m.target_count} · +{m.reward_xp} XP
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    m.completed ? "bg-emerald-100 text-emerald-800" : "bg-secondary"
                  }`}
                >
                  {m.completed ? "Done" : "In progress"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "Store" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {store.map((item) => (
            <Card key={item.code}>
              <CardHeader>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-semibold">{item.cost_points}</span> pts · {item.stock} left ·{" "}
                  <span className="capitalize">{item.item_type.replace("_", " ")}</span>
                </div>
                <Button size="sm" onClick={() => redeem(item.code)} disabled={item.stock <= 0}>
                  Redeem
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "Leaderboard" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">City citizens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaders.map((l) => (
                <div
                  key={l.rank}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm"
                >
                  <span>
                    #{l.rank} {l.display_name}{" "}
                    <span className="text-muted-foreground">
                      · {l.ward} · Lv {l.level}
                    </span>
                  </span>
                  <span className="font-medium">{l.xp} XP</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cleanest wards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {wards.map((w) => (
                <div
                  key={w.ward}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm"
                >
                  <span>
                    #{w.rank} {w.ward}{" "}
                    <span className="text-muted-foreground">
                      · score {w.cleanliness_score.toFixed(1)}
                    </span>
                  </span>
                  <span className="font-medium">{w.total_xp} XP</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "Alerts" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await api("/api/gamification/notifications/read-all", { method: "POST" });
                await refresh();
              }}
            >
              Mark all read
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifs.length === 0 && (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            )}
            {notifs.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  n.read ? "bg-secondary/40" : "bg-emerald-50 ring-1 ring-emerald-100"
                }`}
              >
                <div className="font-medium">{n.title}</div>
                <div className="text-muted-foreground">{n.body}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {n.kind} · {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
