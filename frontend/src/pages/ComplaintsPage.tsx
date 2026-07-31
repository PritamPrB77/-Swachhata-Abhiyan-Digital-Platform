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

type Complaint = {
  id: number;
  category: string;
  description: string;
  status: string;
  ward: string;
  latitude: number;
  longitude: number;
  image_url: string;
  citizen_name: string;
  assignee_name: string;
  created_at: string;
};

const categories = [
  { value: "garbage", label: "Garbage" },
  { value: "street_cleaning", label: "Street cleaning" },
  { value: "toilet", label: "Toilet" },
  { value: "drainage", label: "Drainage" },
  { value: "other", label: "Other" },
];

export function ComplaintsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [category, setCategory] = useState("garbage");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await api<Complaint[]>("/api/complaints/");
    setItems(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 18.5204, lng: 73.8567 }),
      );
    } else {
      setCoords({ lat: 18.5204, lng: 73.8567 });
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      let image_key = "";
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await api<{ image_key: string }>("/api/complaints/upload", {
          method: "POST",
          body: fd,
        });
        image_key = up.image_key;
      }
      const created = await api<{ id: number }>("/api/complaints/", {
        method: "POST",
        body: JSON.stringify({
          category,
          description,
          latitude: coords?.lat ?? 18.52,
          longitude: coords?.lng ?? 73.85,
          ward: user?.ward ?? "Ward-1",
          image_key,
        }),
      });
      const award = await awardAction(
        "complaint_submitted",
        "complaint",
        String(created.id),
        "Complaint submitted",
      );
      setDescription("");
      setFile(null);
      setMsg(
        award?.awarded
          ? `Complaint submitted · +${award.xp_gained} XP`
          : "Complaint submitted",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function updateStatus(id: number, status: string) {
    await api(`/api/complaints/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        assignee_id: user?.id,
        assignee_name: user?.full_name,
      }),
    });
    if (status === "resolved") {
      await awardAction("complaint_resolved", "complaint", String(id), "Issue resolved");
    } else if (status === "assigned") {
      await awardAction("complaint_verified", "complaint", `assign-${id}`, "Complaint assigned");
    }
    await load();
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="font-display text-3xl font-semibold">Complaints</h1>
        <p className="text-muted-foreground">Geo-tagged reports with optional photo evidence.</p>
      </FadeIn>

      {user?.role === "citizen" && (
        <FadeIn delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Submit complaint</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-white/80 px-3 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Photo</Label>
                  <Input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div className="md:col-span-2 text-sm text-muted-foreground">
                  Location: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Detecting…"}
                </div>
                {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
                {msg && <p className="text-sm text-emerald-700 md:col-span-2">{msg}</p>}
                <Button type="submit">Submit</Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <div className="grid gap-4">
        {items.map((c) => (
          <Card key={c.id}>
            <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{c.category.replace("_", " ")}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs capitalize text-emerald-800">{c.status.replace("_", " ")}</span>
                  <span className="text-xs text-muted-foreground">{c.ward}</span>
                </div>
                <p className="mt-2 font-medium">{c.description}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  By {c.citizen_name}
                  {c.assignee_name ? ` · Assigned to ${c.assignee_name}` : ""}
                </p>
                {c.image_url && (
                  <img src={c.image_url} alt="" className="mt-3 max-h-40 rounded-lg object-cover" />
                )}
              </div>
              {(user?.role === "driver" || user?.role === "officer" || user?.role === "admin") && (
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(c.id, "assigned")}>
                    Assign me
                  </Button>
                  <Button size="sm" onClick={() => updateStatus(c.id, "in_progress")}>
                    In progress
                  </Button>
                  <Button size="sm" variant="accent" onClick={() => updateStatus(c.id, "resolved")}>
                    Resolve
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
