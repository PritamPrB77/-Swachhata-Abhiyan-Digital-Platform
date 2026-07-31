import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fetchProfile, GameProfile } from "@/lib/gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, GradientText } from "@/components/magic/effects";

type Stats = {
  total: number;
  pending: number;
  resolved: number;
  critical: number;
};

export function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [game, setGame] = useState<GameProfile | null>(null);

  useEffect(() => {
    api<Stats>("/api/complaints/stats").then(setStats).catch(() => undefined);
    if (user?.role === "citizen" || user?.role === "driver") {
      fetchProfile().then(setGame);
    }
  }, [user?.role]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-semibold">
          <GradientText>Profile</GradientText>
        </h1>
        <p className="text-muted-foreground">Your account details and activity snapshot.</p>
      </FadeIn>

      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-800 via-teal-600 to-amber-500" />
        <CardContent className="-mt-10 space-y-4 p-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-emerald-700 text-3xl font-bold text-white shadow-lg">
            {user?.full_name?.slice(0, 1)}
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold">{user?.full_name}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <Item label="Role" value={user?.role || ""} />
            <Item label="Ward" value={user?.ward || ""} />
            <Item label="User ID" value={String(user?.id || "")} />
            <Item label="Phone" value={user?.phone || "—"} />
          </dl>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complaint summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
            <Mini label="Total" v={stats.total} />
            <Mini label="Pending" v={stats.pending} />
            <Mini label="Resolved" v={stats.resolved} />
            <Mini label="Critical" v={stats.critical} />
          </CardContent>
        </Card>
      )}

      {game && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gamification</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
            <Mini label="Level" v={game.level} />
            <Mini label="XP" v={game.xp} />
            <Mini label="Points" v={game.points} />
            <Mini label="Badges" v={game.badges_count} />
          </CardContent>
        </Card>
      )}

      {(user?.role === "officer" || user?.role === "admin") && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Officers and admins review complaints, assign workers, and monitor live fleet.
            Rewards / XP programs are for citizens and field workers only.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="capitalize font-medium">{value}</dd>
    </div>
  );
}

function Mini({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <div className="text-xl font-semibold tabular-nums">{v}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
