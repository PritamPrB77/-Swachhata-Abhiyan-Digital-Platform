import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, User } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, GradientText, ShimmerButton } from "@/components/magic/effects";

type AuthResponse = { access_token: string; user: User };

export function LandingPage() {
  const { user, loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("citizen@example.com");
  const [password, setPassword] = useState("citizen123");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"citizen" | "driver">("citizen");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, full_name: fullName, role, ward: "Ward-1" };
      const data = await api<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      loginSuccess(data.access_token, data.user);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <FadeIn>
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-800/70">
          Swachhata Abhiyan
        </p>
        <h1 className="font-display text-5xl font-semibold leading-tight md:text-6xl">
          <GradientText>Cleaner wards.</GradientText>
          <br />
          Stronger cities.
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted-foreground">
          Report issues, track waste trucks live from the driver’s phone GPS, and join local
          cleanliness drives — all in one web portal.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-emerald-900/10">Citizen reports</span>
          <span className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-emerald-900/10">Live driver GPS</span>
          <span className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-emerald-900/10">Volunteer drives</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.12}>
        <Card className="border-emerald-900/10 shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <CardTitle>{mode === "login" ? "Welcome back" : "Create account"}</CardTitle>
            <CardDescription>
              Demo: citizen@example.com / citizen123 · driver@ / driver123 · officer@ / officer123
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      className="flex h-10 w-full rounded-md border border-input bg-white/80 px-3 text-sm"
                      value={role}
                      onChange={(e) => setRole(e.target.value as "citizen" | "driver")}
                    >
                      <option value="citizen">Citizen</option>
                      <option value="driver">Driver</option>
                    </select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <ShimmerButton type="submit" disabled={loading} className="w-full">
                {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Register"}
              </ShimmerButton>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Served via nginx at <Link to="/">http://localhost</Link> — no service ports exposed.
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
