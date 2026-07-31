import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ClipboardPlus, MapPinned, Megaphone, Truck, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, GradientText } from "@/components/magic/effects";
import { Button } from "@/components/ui/button";
import { dailyCheckin, fetchProfile, GameProfile } from "@/lib/gamification";

export function HomePage() {
  const { user } = useAuth();
  const [game, setGame] = useState<GameProfile | null>(null);

  useEffect(() => {
    dailyCheckin().finally(() => {
      fetchProfile().then(setGame);
    });
  }, []);

  const cards = [
    {
      title: "Report an issue",
      desc: "Geo-tagged photo complaints for garbage, drains, and more.",
      to: "/app/complaints",
      icon: ClipboardPlus,
      roles: ["citizen", "driver", "officer", "admin"],
    },
    {
      title: "Share live GPS",
      desc: "Drivers stream phone location while on route — no extra device.",
      to: "/app/track",
      icon: Truck,
      roles: ["driver"],
    },
    {
      title: "Live fleet map",
      desc: "Officers watch trucks move in real time over WebSocket.",
      to: "/app/fleet",
      icon: MapPinned,
      roles: ["officer", "admin", "driver"],
    },
    {
      title: "Cleanliness drives",
      desc: "Register as a volunteer and earn a digital certificate code.",
      to: "/app/drives",
      icon: Megaphone,
      roles: ["citizen", "driver", "officer", "admin"],
    },
    {
      title: "Rewards & XP",
      desc: "Badges, missions, leaderboards, and the reward store.",
      to: "/app/rewards",
      icon: Trophy,
      roles: ["citizen", "driver", "officer", "admin"],
    },
  ].filter((c) => user && c.roles.includes(user.role));

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="font-display text-4xl font-semibold">
          Hello, <GradientText>{user?.full_name}</GradientText>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          You are signed in as <span className="capitalize">{user?.role}</span> for {user?.ward}.
          Pick a workspace below to continue.
        </p>
        {game && (
          <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm ring-1 ring-emerald-900/10">
            <span className="capitalize font-medium">{game.tier}</span>
            <span>· Lv {game.level}</span>
            <span>· {game.xp} XP</span>
            <span>· {game.points} pts</span>
            <span>· streak {game.daily_streak}d</span>
          </p>
        )}
      </FadeIn>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => (
          <FadeIn key={c.to} delay={0.06 * i}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">{c.title}</CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to={c.to}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
