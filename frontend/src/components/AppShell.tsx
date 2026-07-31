import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Leaf,
  LogOut,
  MapPinned,
  Megaphone,
  Truck,
  ClipboardList,
  Trophy,
  Moon,
  Sun,
  LayoutDashboard,
  UserRound,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const links = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, roles: ["citizen", "driver", "officer", "admin"] },
    { to: "/app/complaints", label: "Complaints", icon: ClipboardList, roles: ["citizen", "driver", "officer", "admin"] },
    { to: "/app/track", label: "Share GPS", icon: Truck, roles: ["driver"] },
    { to: "/app/fleet", label: "Live Map", icon: MapPinned, roles: ["citizen", "driver", "officer", "admin"] },
    { to: "/app/drives", label: "Drives", icon: Megaphone, roles: ["citizen", "driver", "officer", "admin"] },
    { to: "/app/rewards", label: "Rewards", icon: Trophy, roles: ["citizen", "driver"] },
    { to: "/app/profile", label: "Profile", icon: UserRound, roles: ["citizen", "driver", "officer", "admin"] },
  ].filter((l) => user && l.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-border bg-card/95 backdrop-blur-2xl transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F9D58] to-[#22C55E] shadow-lg shadow-emerald-950/30">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <div>
            <div className="font-display text-lg font-bold leading-none">Swachhata</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Abhiyan</div>
          </div>
          <button type="button" className="ml-auto text-muted-foreground md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/app"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#0F9D58] to-[#0EA5E9] text-white shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4 text-xs text-muted-foreground">
          <div className="mb-1 text-[10px] uppercase tracking-wider">Signed in as</div>
          <div className="capitalize font-medium text-foreground">{user?.role}</div>
          <div className="mt-0.5">{user?.ward}</div>
        </div>
      </aside>

      {open && (
        <button type="button" className="fixed inset-0 z-40 bg-black/50 md:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
          <button type="button" className="md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-muted-foreground sm:block">
            <span className="font-display font-semibold text-foreground">Workspace</span>
            <span className="mx-2">·</span>
            <span className="capitalize">{user?.role}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDark((d) => !d)} aria-label="Theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/app/profile")}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 pr-3 text-left hover:bg-muted"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-[#0F9D58] text-xs font-semibold text-white">
                {user?.full_name?.slice(0, 1) || "U"}
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-medium leading-none">{user?.full_name}</span>
                <span className="text-[11px] text-muted-foreground">{user?.email}</span>
              </span>
            </button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="relative flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
