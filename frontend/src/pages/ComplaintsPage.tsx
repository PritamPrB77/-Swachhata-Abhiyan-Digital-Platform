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
import { analyzeComplaintText, urgencyColor, useLiveSentiment } from "@/lib/sentiment";

type Complaint = {
  id: number;
  category: string;
  description: string;
  status: string;
  ward: string;
  latitude: number;
  longitude: number;
  photo_latitude?: number | null;
  photo_longitude?: number | null;
  image_url: string;
  urgency: string;
  sentiment_score: number;
  sentiment_label: string;
  citizen_name: string;
  assignee_name: string;
  officer_notes: string;
  created_at: string;
  updated_at: string;
};

type Comment = {
  id: number;
  user_name: string;
  role: string;
  body: string;
  sentiment_label: string;
  created_at: string;
};

const categories = [
  { value: "garbage", label: "Garbage" },
  { value: "street_cleaning", label: "Street cleaning" },
  { value: "toilet", label: "Toilet" },
  { value: "drainage", label: "Drainage" },
  { value: "other", label: "Other" },
];

const STATUS_FLOW = ["submitted", "assigned", "in_progress", "resolved"];

export function ComplaintsPage() {
  const { user } = useAuth();
  const canFile = user?.role === "citizen" || user?.role === "driver";
  const canReview = user?.role === "officer" || user?.role === "admin" || user?.role === "driver";

  const [items, setItems] = useState<Complaint[]>([]);
  const [category, setCategory] = useState("garbage");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoCoords, setPhotoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [notes, setNotes] = useState("");

  const liveSentiment = useLiveSentiment(description);

  async function load() {
    const data = await api<Complaint[]>("/api/complaints/");
    setItems(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
    grabLocation((c) => setCoords(c));
  }, []);

  function grabLocation(cb: (c: { lat: number; lng: number }) => void) {
    if (!navigator.geolocation) {
      cb({ lat: 18.5204, lng: 73.8567 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => cb({ lat: 18.5204, lng: 73.8567 }),
      { enableHighAccuracy: true },
    );
  }

  function onPhotoChange(f: File | null) {
    setFile(f);
    if (f) {
      // Location-based photograph: capture GPS at photo time
      grabLocation((c) => {
        setPhotoCoords(c);
        setCoords(c);
      });
    }
  }

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
      const analysis = analyzeComplaintText(description);
      const created = await api<Complaint>("/api/complaints/", {
        method: "POST",
        body: JSON.stringify({
          category,
          description,
          latitude: coords?.lat ?? 18.52,
          longitude: coords?.lng ?? 73.85,
          photo_latitude: photoCoords?.lat ?? coords?.lat,
          photo_longitude: photoCoords?.lng ?? coords?.lng,
          ward: user?.ward ?? "Ward-1",
          image_key,
          urgency: analysis.urgency,
          sentiment_score: analysis.score,
          sentiment_label: analysis.label,
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
          ? `Filed #${created.id} · urgency ${created.urgency} · +${award.xp_gained} XP`
          : `Filed #${created.id} · urgency ${created.urgency}`,
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
        officer_notes: notes || undefined,
      }),
    });
    if (status === "resolved") {
      await awardAction("complaint_resolved", "complaint", String(id), "Issue resolved");
    } else if (status === "assigned") {
      await awardAction("complaint_verified", "complaint", `assign-${id}`, "Assigned");
    }
    await load();
    if (selected?.id === id) {
      const fresh = await api<Complaint>(`/api/complaints/${id}`);
      setSelected(fresh);
    }
  }

  async function openDetail(c: Complaint) {
    setSelected(c);
    setNotes(c.officer_notes || "");
    const rows = await api<Comment[]>(`/api/complaints/${c.id}/comments`);
    setComments(rows);
  }

  async function postComment(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await api(`/api/complaints/${selected.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: commentBody }),
    });
    setCommentBody("");
    const rows = await api<Comment[]>(`/api/complaints/${selected.id}/comments`);
    setComments(rows);
    const fresh = await api<Complaint>(`/api/complaints/${selected.id}`);
    setSelected(fresh);
    await load();
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="font-display text-3xl font-semibold">
          {canReview && !canFile ? "Complaint review" : "Complaints"}
        </h1>
        <p className="text-muted-foreground">
          History, status timeline, photo GPS, and urgency from comment sentiment.
        </p>
      </FadeIn>

      {canFile && (
        <FadeIn delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Report an issue</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-white/80 px-3 text-sm dark:bg-card"
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
                  <Label>Photo (auto-captures GPS)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Describe the issue — urgent words raise priority automatically"
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 capitalize ${urgencyColor(liveSentiment.urgency)}`}>
                      Predicted urgency: {liveSentiment.urgency}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5">
                      Sentiment: {liveSentiment.label} ({liveSentiment.score})
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2 text-sm text-muted-foreground">
                  Report location:{" "}
                  {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Detecting…"}
                  {photoCoords && (
                    <span>
                      {" "}
                      · Photo GPS: {photoCoords.lat.toFixed(6)}, {photoCoords.lng.toFixed(6)}
                    </span>
                  )}
                </div>
                {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
                {msg && <p className="text-sm text-emerald-700 md:col-span-2">{msg}</p>}
                <Button type="submit">Submit complaint</Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-xl">History</h2>
          {items.map((c) => (
            <Card
              key={c.id}
              className={`cursor-pointer transition hover:ring-2 hover:ring-primary/30 ${
                selected?.id === c.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => openDetail(c)}
            >
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${urgencyColor(c.urgency || "medium")}`}>
                    {c.urgency || "medium"}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                    {c.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">#{c.id}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium">{c.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.citizen_name} · {c.ward} · {new Date(c.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          {selected ? (
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-xl">Complaint #{selected.id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusTimeline status={selected.status} />
                <p className="text-sm">{selected.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 capitalize ${urgencyColor(selected.urgency)}`}>
                    {selected.urgency}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5">
                    {selected.sentiment_label} ({selected.sentiment_score})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  GPS: {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                  {selected.photo_latitude != null && (
                    <>
                      <br />
                      Photo GPS: {selected.photo_latitude.toFixed(6)},{" "}
                      {selected.photo_longitude?.toFixed(6)}
                    </>
                  )}
                </p>
                {selected.image_url && (
                  <img src={selected.image_url} alt="" className="max-h-56 rounded-lg object-cover" />
                )}

                {canReview && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <Label>Officer / worker notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(selected.id, "assigned")}>
                        Assign me
                      </Button>
                      <Button size="sm" onClick={() => updateStatus(selected.id, "in_progress")}>
                        In progress
                      </Button>
                      <Button size="sm" variant="accent" onClick={() => updateStatus(selected.id, "resolved")}>
                        Resolve
                      </Button>
                      {(user?.role === "officer" || user?.role === "admin") && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "rejected")}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <h3 className="mb-2 font-medium">Comments</h3>
                  <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                    {comments.map((cm) => (
                      <div key={cm.id} className="rounded-lg bg-secondary/50 p-2 text-xs">
                        <strong>
                          {cm.user_name} ({cm.role})
                        </strong>
                        <p>{cm.body}</p>
                        <span className="text-muted-foreground">{cm.sentiment_label}</span>
                      </div>
                    ))}
                  </div>
                  <form className="flex gap-2" onSubmit={postComment}>
                    <Input
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="Add comment…"
                      required
                    />
                    <Button type="submit" size="sm">
                      Post
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-sm text-muted-foreground">
                Select a complaint to view status timeline, photo GPS, and comments.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const idx = STATUS_FLOW.indexOf(status);
  const rejected = status === "rejected";
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_FLOW.map((s, i) => (
        <span
          key={s}
          className={`rounded-full px-2 py-1 text-[10px] capitalize ${
            rejected
              ? "bg-secondary text-muted-foreground"
              : i <= idx
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
          }`}
        >
          {s.replace("_", " ")}
        </span>
      ))}
      {rejected && (
        <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] text-red-800">rejected</span>
      )}
    </div>
  );
}
