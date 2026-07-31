import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/magic/effects";
import { Badge } from "@/components/ui/badge";

type Stats = {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  critical: number;
  high: number;
  overdue?: number;
};

type Funds = {
  drives: number;
  budget_allocated: number;
  spent: number;
  remaining: number;
};

type Score = {
  ward: string;
  score: number;
  formula: string;
  approved_committees: number;
  campaigns: number;
  micro_events: number;
};

export function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [funds, setFunds] = useState<Funds | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<Stats>("/api/complaints/stats"),
      api<Funds>("/api/drives/public/funds").catch(() => null),
      api<Score[]>("/api/awareness/scorecard").catch(() => []),
    ])
      .then(([s, f, sc]) => {
        setStats(s);
        if (f) setFunds(f);
        setScores(sc || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-bold text-foreground">Transparency & reports</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Rule-based scorecards and ledgers — every formula is visible. No ML black boxes.
        </p>
      </FadeIn>
      {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total complaints", stats.total],
            ["Pending", stats.pending],
            ["Resolved", stats.resolved],
            ["Overdue (SLA)", stats.overdue ?? 0],
          ].map(([l, v]) => (
            <Card key={String(l)}>
              <CardContent className="p-4">
                <div className="font-display text-3xl font-bold tabular text-foreground">{v}</div>
                <div className="text-xs font-medium text-muted-foreground">{l}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Fund utilization</CardTitle>
            <CardDescription>From drive-service public ledger totals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-foreground">
            {!funds && <p className="text-sm text-muted-foreground">No fund data yet.</p>}
            {funds && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Drives</span>
                  <span className="font-semibold">{funds.drives}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allocated</span>
                  <span className="font-semibold">₹{funds.budget_allocated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-semibold">₹{funds.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{funds.remaining.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Ward scorecards</CardTitle>
            <CardDescription>Transparent participation formula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scores.length === 0 && <p className="text-sm text-muted-foreground">No ward scores yet.</p>}
            {scores.map((s) => (
              <div key={s.ward} className="rounded-xl border border-border bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{s.ward}</span>
                  <Badge variant="success">{s.score}/100</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.formula}</p>
                <p className="mt-1 text-xs text-foreground">
                  Committees {s.approved_committees} · Campaigns {s.campaigns} · Events {s.micro_events}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Hotspot flagging (rule-based)</CardTitle>
          <CardDescription>
            High volume = critical + high urgency open complaints ≥ 3 in a ward (threshold shown, not ML).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Officers should filter Complaints by Critical/High. Escalated SLA breaches appear in the overdue KPI above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
