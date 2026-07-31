import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  EyeOff,
  Leaf,
  MapPinned,
  Megaphone,
  Quote,
  ShieldCheck,
  Sparkles,
  Trophy,
  Truck,
  Users,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useCountUp, useInViewOnce } from "@/hooks/useCountUp";
import { CityScene } from "@/components/HeroScene";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: "easeOut" as const },
  }),
};

export function LandingNav({
  dark,
  onToggleTheme,
  onReport,
  onLogin,
}: {
  dark: boolean;
  onToggleTheme: () => void;
  onReport: () => void;
  onLogin: () => void;
}) {
  const links = [
    { href: "#platform", label: "Platform" },
    { href: "#citizens", label: "For Citizens" },
    { href: "#municipalities", label: "For Municipalities" },
    { href: "#dashboard", label: "Dashboard" },
    { href: "#impact", label: "Impact" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F0D]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F9D58] to-[#22C55E] shadow-lg shadow-emerald-900/40">
            <Leaf className="h-4 w-4 text-white" />
          </span>
          <div>
            <div className="font-display text-base font-bold leading-none text-white">Swachhata</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70">Abhiyan</div>
          </div>
        </a>
        <nav className="ml-6 hidden items-center gap-5 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-emerald-50/65 transition hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-emerald-50/80 hover:bg-white/10 hover:text-white"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {dark ? "Light" : "Dark"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden text-emerald-50/90 hover:bg-white/10 sm:inline-flex"
            onClick={onLogin}
          >
            Login
          </Button>
          <Button type="button" size="sm" className="bg-saffron text-white hover:bg-orange-500" onClick={onReport}>
            Report an Issue
          </Button>
        </div>
      </div>
    </header>
  );
}

export function HeroSection({ onReport, onDashboard }: { onReport: () => void; onDashboard: () => void }) {
  return (
    <section id="top" className="grain relative overflow-hidden bg-[#0B0F0D] text-white">
      <div className="pointer-events-none absolute -left-20 top-10 h-80 w-80 animate-aurora rounded-full bg-[#0F9D58]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-32 h-96 w-96 animate-aurora rounded-full bg-[#0EA5E9]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#F97316]/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-28 pt-14 lg:grid-cols-2 lg:pt-20">
        <div>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
            <Badge className="mb-5 border border-emerald-400/30 bg-emerald-500/10 text-emerald-200" variant="outline">
              <Sparkles className="mr-1 h-3 w-3" /> Clean India · Smart India
            </Badge>
          </motion.div>
          <motion.h1
            className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl"
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={1}
          >
            India&apos;s Cleanliness,{" "}
            <span className="bg-gradient-to-r from-[#22C55E] via-[#0EA5E9] to-[#F97316] bg-clip-text text-transparent">
              Tracked in Real Time
            </span>
          </motion.h1>
          <motion.p
            className="mt-5 max-w-lg text-lg text-emerald-50/75"
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={2}
          >
            Report geo-tagged issues, watch waste trucks live, score every ward, and reward citizens who keep their city clean.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" initial="hidden" animate="show" variants={fadeUp} custom={3}>
            <Button type="button" size="lg" className="bg-[#0F9D58] hover:bg-[#0d8a4c]" onClick={onReport}>
              Report an Issue <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10"
              onClick={onDashboard}
            >
              View Live Dashboard
            </Button>
          </motion.div>
          <motion.div className="mt-8 flex flex-wrap gap-3" initial="hidden" animate="show" variants={fadeUp} custom={4}>
            {[
              { icon: ShieldCheck, t: "Govt-aligned civic stack" },
              { icon: Leaf, t: "Swachh Bharat Mission ready" },
            ].map((b) => (
              <span
                key={b.t}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-emerald-50/85"
              >
                <b.icon className="h-3.5 w-3.5 text-[#22C55E]" />
                {b.t}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="relative h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-2xl shadow-emerald-950/40 md:h-[440px]"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <CityScene className="h-full w-full" />
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex gap-2">
            <div className="glass rounded-2xl px-3 py-2 text-xs text-emerald-950 dark:text-white">
              <span className="font-semibold text-[#0F9D58]">Live</span> · Truck #T-12 moving
            </div>
            <div className="glass rounded-2xl px-3 py-2 text-xs text-emerald-950 dark:text-white">
              Pin dropped · Ward-4
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatItem({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const { ref, visible } = useInViewOnce<HTMLDivElement>();
  const n = useCountUp(value, 1500, visible);
  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-3xl font-bold tabular text-white md:text-4xl">
        {n.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-emerald-100/60">{label}</div>
    </div>
  );
}

export function StatsStrip() {
  return (
    <div id="impact" className="relative z-10 -mt-14 px-4">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 rounded-3xl border border-white/15 bg-[#0F9D58]/90 px-6 py-8 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl md:grid-cols-4 md:px-10">
        <StatItem label="Complaints resolved" value={12840} suffix="+" />
        <StatItem label="Wards mapped" value={246} />
        <StatItem label="Trucks tracked" value={1180} suffix="+" />
        <StatItem label="Kg waste diverted" value={920} suffix="k" />
      </div>
    </div>
  );
}

export function ProblemSection() {
  const items = [
    { icon: Clock3, title: "Delayed grievance resolution", desc: "Tickets stall without clear ownership or SLAs." },
    { icon: EyeOff, title: "No transparency", desc: "Citizens can’t see progress after they report." },
    { icon: Truck, title: "Poor fleet visibility", desc: "Collection routes stay opaque to officers and public." },
    { icon: Users, title: "Low participation", desc: "No rewards loop means civic engagement fades." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <motion.h2 className="font-display text-3xl font-bold md:text-4xl" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
        The problem we solve
      </motion.h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Sanitation systems fail when data is late, routes are invisible, and citizens have no reason to stay involved.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            custom={i}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: Camera, title: "Report", desc: "Photo + auto GPS + category" },
    { icon: Sparkles, title: "Auto-Assign", desc: "Urgency scored · team routed" },
    { icon: MapPinned, title: "Track", desc: "Live truck GPS on the map" },
    { icon: CheckCircle2, title: "Resolve", desc: "Status timeline + XP rewards" },
  ];
  return (
    <section id="platform" className="bg-muted/50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
        <p className="mt-3 text-muted-foreground">Four steps from street issue to verified clean.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              className="relative rounded-2xl border border-border bg-card p-5"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F9D58] to-[#0EA5E9] text-white">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#0F9D58]">Step {i + 1}</div>
              <h3 className="mt-1 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-emerald-400 md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeatureBento() {
  const cards = [
    {
      title: "Geo-tagged reporting",
      desc: "Camera capture with auto GPS and urgency from your words.",
      span: "md:col-span-2",
      icon: Camera,
      id: "citizens",
    },
    {
      title: "Live GPS trucks",
      desc: "Driver phone GPS streamed over WebSocket.",
      span: "",
      icon: Truck,
    },
    {
      title: "Hotspot signals",
      desc: "Urgency heat from complaint clusters.",
      span: "",
      icon: AlertTriangle,
    },
    {
      title: "Ward scorecards",
      desc: "Cleanliness rings and resolution SLAs.",
      span: "",
      icon: CheckCircle2,
      id: "municipalities",
    },
    {
      title: "Gamification",
      desc: "XP, badges, missions, and store for citizens & workers.",
      span: "",
      icon: Trophy,
    },
    {
      title: "Cleanliness drives",
      desc: "Volunteer signup, attendance, certificates.",
      span: "md:col-span-2",
      icon: Megaphone,
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="font-display text-3xl font-bold md:text-4xl">Platform features</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        A civic operating system — report, assign, track, reward — in one portal.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            id={c.id}
            className={cn(
              "group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#0F9D58]/40 hover:shadow-xl",
              c.span,
            )}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i}
            variants={fadeUp}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F9D58]/10 text-[#0F9D58] transition group-hover:scale-110">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const chartData = [
  { d: "M", v: 12 },
  { d: "T", v: 18 },
  { d: "W", v: 14 },
  { d: "T", v: 22 },
  { d: "F", v: 28 },
  { d: "S", v: 20 },
  { d: "S", v: 25 },
];

export function DashboardPreview() {
  return (
    <section id="dashboard" className="bg-[#0B0F0D] py-20 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Live municipal dashboard</h2>
        <p className="mt-3 max-w-2xl text-emerald-50/65">
          KPIs, fleet map, and complaint velocity — the screen officers actually use.
        </p>
        <motion.div
          className="mt-10 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111916] shadow-2xl"
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/30 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs text-white/40">app.swachhata.local/dashboard</span>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
            {[
              ["Open complaints", "128", "rose"],
              ["Avg resolution", "18h", "amber"],
              ["Active vehicles", "42", "emerald"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">{l}</div>
                <div className="mt-1 font-display text-3xl font-bold tabular">{v}</div>
              </div>
            ))}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
              <div className="mb-2 text-xs text-white/50">Complaint trend (7d)</div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#22C55E" fill="url(#g)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F9D58]/30 to-[#0EA5E9]/20 p-4">
              <div className="text-xs text-white/60">Fleet snapshot</div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Truck T-04</span><span className="text-[#22C55E]">Moving</span></div>
                <div className="flex justify-between"><span>Truck T-11</span><span className="text-amber-300">Idle</span></div>
                <div className="flex justify-between"><span>Truck T-19</span><span className="text-[#0EA5E9]">En route</span></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function LeaderboardTeaser() {
  const wards = [
    { rank: 1, ward: "Ward-12", score: 94, delta: "+3" },
    { rank: 2, ward: "Ward-3", score: 91, delta: "+1" },
    { rank: 3, ward: "Ward-7", score: 88, delta: "0" },
    { rank: 4, ward: "Ward-1", score: 85, delta: "+2" },
    { rank: 5, ward: "Ward-9", score: 82, delta: "-1" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ward leaderboard</h2>
          <p className="mt-3 text-muted-foreground">Cleanliness pride, ranked weekly — powered by gamification.</p>
        </div>
        <Badge variant="accent">Rewards for citizens & field workers</Badge>
      </div>
      <div className="mt-8 space-y-3">
        {wards.map((w, i) => (
          <motion.div
            key={w.ward}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i}
            variants={fadeUp}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F9D58]/10 font-display font-bold text-[#0F9D58]">
              {w.rank}
            </div>
            <div className="flex-1 font-semibold">{w.ward}</div>
            <div className="tabular font-display text-xl font-bold">{w.score}</div>
            <Badge variant={w.delta.startsWith("-") ? "danger" : "success"}>{w.delta}</Badge>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  const quotes = [
    {
      q: "I reported a dump with a photo. Within hours a truck showed on the live map and the status flipped to resolved.",
      a: "Ananya R.",
      r: "Citizen · Ward-4",
    },
    {
      q: "Urgency tagging and the queue view cut our assignment time dramatically. Officers finally see the same live fleet as drivers.",
      a: "Suresh K.",
      r: "Municipal Officer",
    },
  ];
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Impact stories</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {quotes.map((t, i) => (
            <motion.blockquote
              key={t.a}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
            >
              <Quote className="mb-3 h-6 w-6 text-[#0F9D58]" />
              <p className="text-lg leading-relaxed text-foreground/90">{t.q}</p>
              <footer className="mt-4 text-sm">
                <div className="font-semibold">{t.a}</div>
                <div className="text-muted-foreground">{t.r}</div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBanner({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0F9D58] via-[#0d8a4c] to-[#0EA5E9] p-8 text-white shadow-2xl md:p-12">
        <h2 className="font-display text-3xl font-bold md:text-5xl">Join the movement</h2>
        <p className="mt-3 max-w-xl text-emerald-50/85">
          Citizens report. Workers act. Officers oversee. Everyone watches the same live map.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" size="lg" className="bg-white text-[#0F9D58] hover:bg-emerald-50" onClick={onLogin}>
            Access portal
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10"
            onClick={onLogin}
          >
            Municipal dashboard
          </Button>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-[#0B0F0D] text-emerald-50/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F9D58]">
              <Leaf className="h-4 w-4 text-white" />
            </span>
            <span className="font-display text-lg font-bold text-white">Swachhata</span>
          </div>
          <p className="mt-3 text-sm text-emerald-50/55">
            Civic-tech for real-time sanitation, fleet visibility, and citizen rewards.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">Platform</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#platform" className="hover:text-white">How it works</a></li>
            <li><a href="#dashboard" className="hover:text-white">Dashboard</a></li>
            <li><a href="#impact" className="hover:text-white">Impact</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">Roles</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#citizens" className="hover:text-white">Citizens</a></li>
            <li><a href="#municipalities" className="hover:text-white">Municipalities</a></li>
            <li><a href="#citizens" className="hover:text-white">Field workers</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">Language</div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {["English", "हिन्दी", "मराठी", "தமிழ்"].map((l) => (
              <span key={l} className="rounded-full border border-white/15 px-3 py-1">{l}</span>
            ))}
          </div>
          <p className="mt-4 text-xs text-emerald-50/40">
            Aligned with Swachh Bharat Mission goals. Demo environment — not an official government website.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-emerald-50/40">
        © {new Date().getFullYear()} Swachhata Abhiyan Digital Platform
      </div>
    </footer>
  );
}
