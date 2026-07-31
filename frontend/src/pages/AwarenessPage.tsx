import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/magic/effects";

type Campaign = {
  id: number;
  title: string;
  body: string;
  ward: string;
  created_by_name: string;
  created_at: string;
};

type Committee = {
  id: number;
  name: string;
  ward: string;
  description: string;
  status: string;
  admin_name: string;
};

type MicroEvent = {
  id: number;
  title: string;
  description: string;
  ward: string;
  starts_at: string;
  ends_at: string;
  rsvp_count: number;
};

export function AwarenessPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [events, setEvents] = useState<MicroEvent[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [campTitle, setCampTitle] = useState("");
  const [campBody, setCampBody] = useState("");

  async function load() {
    const [camps, evs] = await Promise.all([
      api<Campaign[]>("/api/awareness/campaigns"),
      api<MicroEvent[]>("/api/awareness/calendar"),
    ]);
    setCampaigns(camps);
    setEvents(evs);
    try {
      setCommittees(await api<Committee[]>("/api/awareness/committees"));
    } catch {
      /* optional auth */
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function applyCommittee(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/awareness/committees", {
        method: "POST",
        body: JSON.stringify({ name: cName, description: cDesc, ward: user?.ward || "Ward-1" }),
      });
      setMsg("Committee application submitted for officer approval");
      setCName("");
      setCDesc("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function publishCampaign(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/awareness/campaigns", {
        method: "POST",
        body: JSON.stringify({ title: campTitle, body: campBody, ward: "city" }),
      });
      setMsg("Campaign published");
      setCampTitle("");
      setCampBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-bold text-foreground">Awareness & Committees</h1>
        <p className="mt-1 text-muted-foreground">
          Local Cleanliness Committees, awareness campaigns, and community event calendar — no AI, just civic participation.
        </p>
      </FadeIn>
      {msg && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{msg}</p>}
      {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Campaign feed</CardTitle>
            <CardDescription>Public awareness posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.length === 0 && <p className="text-sm text-muted-foreground">No campaigns yet.</p>}
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-muted p-3">
                <div className="font-semibold text-foreground">{c.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.ward} · {c.created_by_name} · {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Event calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 && <p className="text-sm text-muted-foreground">No micro-events scheduled.</p>}
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted p-3">
                <div>
                  <div className="font-semibold text-foreground">{ev.title}</div>
                  <p className="text-sm text-muted-foreground">{ev.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ev.ward} · {new Date(ev.starts_at).toLocaleString()} · {ev.rsvp_count} RSVPs
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await api(`/api/awareness/events/${ev.id}/rsvp`, { method: "POST" });
                    await load();
                  }}
                >
                  RSVP
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Apply for a committee</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={applyCommittee}>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Committee name" required />
              <Textarea value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Why this ward needs one" />
              <Button type="submit">Submit application</Button>
            </form>
            <div className="mt-4 space-y-2">
              {committees.map((c) => (
                <div key={c.id} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                  <span className="font-medium">{c.name}</span> · {c.ward} ·{" "}
                  <span className="capitalize text-muted-foreground">{c.status}</span>
                  {(user?.role === "officer" || user?.role === "admin") && c.status === "pending" && (
                    <Button
                      size="sm"
                      className="ml-2"
                      onClick={async () => {
                        await api(`/api/awareness/committees/${c.id}/approve`, { method: "POST" });
                        await load();
                      }}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {(user?.role === "officer" || user?.role === "admin") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Publish campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={publishCampaign}>
                <Input value={campTitle} onChange={(e) => setCampTitle(e.target.value)} placeholder="Title" required />
                <Textarea value={campBody} onChange={(e) => setCampBody(e.target.value)} placeholder="Message" required />
                <Button type="submit">Publish</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
