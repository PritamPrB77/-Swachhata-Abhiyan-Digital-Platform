import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, Role, User } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CtaBanner,
  DashboardPreview,
  FeatureBento,
  HeroSection,
  HowItWorks,
  LandingFooter,
  LandingNav,
  LeaderboardTeaser,
  ProblemSection,
  StatsStrip,
  Testimonials,
} from "@/components/landing/sections";

type AuthResponse = { access_token: string; user: User };

const ROLES: { id: Role; title: string; blurb: string; email: string; password: string }[] = [
  { id: "citizen", title: "Citizen", blurb: "Report issues · earn XP & badges", email: "citizen@example.com", password: "citizen123" },
  { id: "driver", title: "Field Worker", blurb: "Live GPS · close assigned jobs", email: "driver@example.com", password: "driver123" },
  { id: "officer", title: "Municipal Officer", blurb: "Review urgency · assign teams", email: "officer@example.com", password: "officer123" },
  { id: "admin", title: "Administrator", blurb: "Full city oversight dashboard", email: "admin@example.com", password: "admin123" },
];

export function LandingPage() {
  const { user, loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("citizen");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("citizen@example.com");
  const [password, setPassword] = useState("citizen123");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"role" | "form">("role");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  if (user) return <Navigate to="/app" replace />;

  function openAuth(roleHint?: Role) {
    if (roleHint) {
      const r = ROLES.find((x) => x.id === roleHint)!;
      setSelectedRole(r.id);
      setEmail(r.email);
      setPassword(r.password);
      setStep("form");
    } else {
      setStep("role");
    }
    setError("");
    setAuthOpen(true);
  }

  function pickRole(r: (typeof ROLES)[0]) {
    setSelectedRole(r.id);
    setEmail(r.email);
    setPassword(r.password);
    setMode("login");
    setStep("form");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : {
              email,
              password,
              full_name: fullName,
              role: selectedRole === "officer" || selectedRole === "admin" ? "citizen" : selectedRole,
              ward: "Ward-1",
            };
      const data = await api<AuthResponse>(path, { method: "POST", body: JSON.stringify(body) });
      if (mode === "login" && data.user.role !== selectedRole) {
        setError(`This account is “${data.user.role}”. Pick that role card.`);
        return;
      }
      loginSuccess(data.access_token, data.user);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
        onReport={() => openAuth("citizen")}
        onLogin={() => openAuth()}
      />
      <HeroSection onReport={() => openAuth("citizen")} onDashboard={() => openAuth("officer")} />
      <StatsStrip />
      <ProblemSection />
      <HowItWorks />
      <FeatureBento />
      <DashboardPreview />
      <LeaderboardTeaser />
      <Testimonials />
      <CtaBanner onLogin={() => openAuth()} />
      <LandingFooter />

      {authOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="relative w-full max-w-lg border-border shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full px-2 text-muted-foreground hover:bg-muted"
              onClick={() => setAuthOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            {step === "role" ? (
              <>
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Choose your role</CardTitle>
                  <CardDescription>Officers & admins review — rewards stay with citizens and field workers.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => pickRole(r)}
                      className="rounded-2xl border border-border p-4 text-left transition hover:border-primary hover:bg-primary/5"
                    >
                      <div className="font-display text-lg font-semibold">{r.title}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.blurb}</p>
                    </button>
                  ))}
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <button type="button" className="mb-1 text-left text-sm text-muted-foreground" onClick={() => setStep("role")}>
                    ← Change role
                  </button>
                  <CardTitle className="font-display text-2xl capitalize">{selectedRole} access</CardTitle>
                  <CardDescription>Demo credentials are prefilled.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={onSubmit}>
                    {mode === "register" && selectedRole !== "officer" && selectedRole !== "admin" && (
                      <div className="space-y-2">
                        <Label>Full name</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="text-sm text-rose-600">{error}</p>}
                    <Button type="submit" className="w-full bg-[#0F9D58] hover:bg-[#0d8a4c]" disabled={loading}>
                      {loading ? "Signing in…" : "Enter dashboard"}
                    </Button>
                    {selectedRole !== "officer" && selectedRole !== "admin" && (
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                        {mode === "login" ? "Create account" : "Have an account? Sign in"}
                      </Button>
                    )}
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
