import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/magic/effects";
import { awardAction } from "@/lib/gamification";

type Drive = {
  id: number;
  title: string;
  description: string;
  location: string;
  ward: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  signup_count: number;
  status: string;
};

type Signup = {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  attended: boolean;
  certificate_code: string;
};

export function DrivesPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [mine, setMine] = useState<Signup[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    ward: user?.ward || "Ward-1",
    starts_at: "",
    ends_at: "",
    capacity: 40,
  });

  async function load() {
    const [d, s] = await Promise.all([
      api<Drive[]>("/api/drives/"),
      api<Signup[]>("/api/drives/me/signups"),
    ]);
    setDrives(d);
    setMine(s);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function createDrive(e: FormEvent) {
    e.preventDefault();
    await api("/api/drives/", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      }),
    });
    setForm({ ...form, title: "", description: "", location: "" });
    await load();
  }

  async function signup(id: number) {
    await api(`/api/drives/${id}/signup`, { method: "POST" });
    await awardAction("volunteer_event", "drive", String(id), "Joined cleanliness drive");
    await load();
  }

  async function markAttendance(eventId: number, userId: number) {
    await api(`/api/drives/${eventId}/attendance/${userId}`, { method: "POST" });
    await awardAction(
      "volunteer_event",
      "drive_attendance",
      `${eventId}-${userId}`,
      "Drive attendance",
    );
    await load();
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="font-display text-3xl font-semibold">Cleanliness drives</h1>
        <p className="text-muted-foreground">Volunteer, attend, and collect a certificate code.</p>
      </FadeIn>

      {(user?.role === "officer" || user?.role === "admin") && (
        <FadeIn delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Schedule a drive</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={createDrive}>
                <div className="space-y-2 md:col-span-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Starts</Label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ends</Label>
                  <Input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit">Create</Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4">
        {drives.map((d) => {
          const my = mine.find((m) => m.event_id === d.id);
          return (
            <Card key={d.id}>
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold">{d.title}</h3>
                  <p className="text-sm text-muted-foreground">{d.description}</p>
                  <p className="mt-2 text-sm">
                    {d.location} · {d.ward} · {d.signup_count}/{d.capacity} joined
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.starts_at).toLocaleString()} → {new Date(d.ends_at).toLocaleString()}
                  </p>
                  {my?.certificate_code && (
                    <p className="mt-2 text-sm font-medium text-emerald-800">
                      Certificate: {my.certificate_code}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {!my && (
                    <Button onClick={() => signup(d.id)}>Register</Button>
                  )}
                  {my && !my.attended && (
                    <span className="rounded-md bg-secondary px-3 py-2 text-center text-sm">Registered</span>
                  )}
                  {(user?.role === "officer" || user?.role === "admin") && my && (
                    <Button variant="secondary" onClick={() => markAttendance(d.id, my.user_id)}>
                      Mark my attendance (demo)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
