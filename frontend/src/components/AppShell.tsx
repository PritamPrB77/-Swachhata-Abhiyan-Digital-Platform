import { Link, NavLink, Outlet } from "react-router-dom";
import { Leaf, LogOut, MapPinned, Megaphone, Truck, ClipboardList, Trophy, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/magic/effects";

export function AppShell() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const links = [
    { to: "/app", label: "Home", icon: Leaf, roles: ["citizen", "driver", "officer", "admin"] },
    { to: "/app/complaints", label: "Complaints", icon: ClipboardList, roles: ["citizen", "driver", "officer", "admin"] },
    { to: "/app/track", label: "Share GPS", icon: Truck, roles: ["driver"] },
    { to: "/app/fleet", label: "Live Fleet", icon: MapPinned, roles: ["officer", "admin", "driver"] },
    { to: "/app/drives", label: "Drives", icon: Megaphone, roles: ["citizen", "driver", "officer", "admin"] },
    { to: "/app/rewards", label: "Rewards", icon: Trophy, roles: ["citizen", "driver", "officer", "admin"] },
  ].filter((l) => user && l.roles.includes(user.role));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/app" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-lg leading-none">
                <GradientText>Swachhata</GradientText>
              </div>
              <div className="text-xs text-muted-foreground">Clean India Portal</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/app"}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70"
                  }`
                }
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Toggle dark mode"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium">{user?.full_name}</div>
              <div className="text-xs capitalize text-muted-foreground">
                {user?.role} · {user?.ward}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/app"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
