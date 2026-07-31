import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  AwardResult,
  GameProfile,
  dailyCheckin,
  fetchProfile,
} from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const tabs = ["Overview", "Badges", "Missions", "Store", "Wallet", "Leaderboard", "Alerts"] as const;

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
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t
                ? "bg-primary text-primary-foreground shadow"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
          {toast}
        </div>
      )}
      {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}

      {tab === "Overview" && profile && (
        <FadeIn>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{profile.display_name}</CardTitle>
                <CardDescription className="capitalize text-muted-foreground">
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
                  <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Level {profile.level}</span>
                    <span>{profile.xp_to_next_level} XP to next</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-amber-500 transition-all"
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
                          : "border border-border bg-muted text-muted-foreground"
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
                <CardTitle className="text-lg text-foreground">Active challenges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {challenges.map((c) => (
                  <div key={c.code} className="rounded-lg border border-border bg-muted p-3">
                    <div className="font-semibold text-foreground">{c.title}</div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <p className="mt-1 text-xs text-foreground">
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
              className={b.earned ? "border-amber-500/50 bg-amber-500/10" : "opacity-80"}
            >
              <CardContent className="p-5">
                <div className="text-3xl">{b.icon}</div>
                <div className="mt-2 font-display text-lg font-semibold text-foreground">{b.name}</div>
                <p className="text-sm text-muted-foreground">{b.description}</p>
                <p className="mt-2 text-xs text-foreground">
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
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    m.completed
                      ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                      : "border border-border bg-muted text-foreground"
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
                <CardTitle className="text-lg text-foreground">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-foreground">
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

      {tab === "Wallet" && profile && (
        <WalletPanel points={profile.points} onDone={async (msg) => { setToast(msg); await refresh(); }} onError={setError} />
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
                  className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
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
                  className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
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
                className={`rounded-lg border px-3 py-2 text-sm ${
                  n.read
                    ? "border-border bg-muted text-foreground"
                    : "border-emerald-500/40 bg-emerald-500/15 text-foreground"
                }`}
              >
                <div className="font-semibold">{n.title}</div>
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
      <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

function WalletPanel({
  points,
  onDone,
  onError,
}: {
  points: number;
  onDone: (msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [upi, setUpi] = useState("");
  const [amountPts, setAmountPts] = useState(100);
  const [ledger, setLedger] = useState<
    { id: number; kind: string; points: number; inr_amount: number; status: string; created_at: string }[]
  >([]);
  const [rate, setRate] = useState({ points_per_rupee: 10, min_redeem_points: 100 });

  useEffect(() => {
    api<{ points_per_rupee: number; min_redeem_points: number }>("/api/gamification/wallet/config")
      .then(setRate)
      .catch(() => undefined);
    api<typeof ledger>("/api/gamification/wallet/ledger")
      .then(setLedger)
      .catch(() => undefined);
  }, []);

  const inr = Math.floor(amountPts / Math.max(rate.points_per_rupee, 1));

  async function requestPayout() {
    try {
      const r = await api<{ status: string; inr_amount: number; provider_ref: string }>(
        "/api/gamification/wallet/redeem",
        {
          method: "POST",
          body: JSON.stringify({ points: amountPts, upi_id: upi }),
        },
      );
      await onDone(`Payout ${r.status}: ₹${r.inr_amount} · ref ${r.provider_ref}`);
      const rows = await api<typeof ledger>("/api/gamification/wallet/ledger");
      setLedger(rows);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Payout failed");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Cash redeem (stub payout)</CardTitle>
          <CardDescription>
            Points stay in-app. Redemption calls a mocked payout partner (Razorpay/Cashfree-style) — no custodial wallet.
            Rate: {rate.points_per_rupee} pts = ₹1 · min {rate.min_redeem_points} pts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground">
            Available: <strong className="tabular">{points}</strong> points
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">UPI ID</label>
            <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@upi" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Points to redeem</label>
            <Input
              type="number"
              value={amountPts}
              min={rate.min_redeem_points}
              onChange={(e) => setAmountPts(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-muted-foreground">≈ ₹{inr}</p>
          </div>
          <Button type="button" onClick={requestPayout} disabled={!upi || amountPts < rate.min_redeem_points}>
            Request payout
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Wallet ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ledger.length === 0 && <p className="text-sm text-muted-foreground">No payouts yet.</p>}
          {ledger.map((row) => (
            <div key={row.id} className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
              <div className="font-medium capitalize">
                {row.kind} · {row.status}
              </div>
              <div className="text-muted-foreground">
                {row.points} pts · ₹{row.inr_amount} · {new Date(row.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
