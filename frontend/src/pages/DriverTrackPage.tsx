import { useEffect, useRef, useState } from "react";
import { api, getToken } from "@/lib/api";
import { wsUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/magic/effects";

type Vehicle = {
  id: number;
  plate_number: string;
  label: string;
  ward: string;
};

export function DriverTrackPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [tracking, setTracking] = useState(false);
  const [last, setLast] = useState<string>("");
  const [error, setError] = useState("");
  const watchRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    api<Vehicle[]>("/api/fleet/vehicles")
      .then((v) => {
        setVehicles(v);
        if (v[0]) setVehicleId(v[0].id);
      })
      .catch((e) => setError(e.message));
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stop() {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setTracking(false);
  }

  function start() {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser");
      return;
    }
    const token = getToken();
    const ws = new WebSocket(`${wsUrl("/ws/fleet")}?token=${encodeURIComponent(token || "")}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setTracking(true);
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const payload = {
            type: "ping",
            vehicle_id: vehicleId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed: pos.coords.speed ?? 0,
            heading: pos.coords.heading ?? 0,
          };
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
          }
          // Also POST for persistence redundancy
          api("/api/fleet/location", {
            method: "POST",
            body: JSON.stringify(payload),
          }).catch(() => undefined);
          setLast(
            `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} @ ${new Date().toLocaleTimeString()}`,
          );
        },
        (err) => setError(err.message),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
      );
    };

    ws.onerror = () => setError("WebSocket connection failed");
    ws.onclose = () => setTracking(false);
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-semibold">Driver live GPS</h1>
        <p className="text-muted-foreground">
          Your phone location is streamed live to officers. No separate GPS device required.
        </p>
      </FadeIn>
      <FadeIn delay={0.05}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Tracking controls</CardTitle>
            <CardDescription>
              Keep this page open while driving. Uses browser Geolocation + WebSocket.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Assigned vehicle</label>
              <select
                className="flex h-10 w-full max-w-md rounded-md border border-input bg-white/80 px-3 text-sm"
                value={vehicleId ?? ""}
                onChange={(e) => setVehicleId(Number(e.target.value))}
                disabled={tracking}
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} ({v.plate_number})
                  </option>
                ))}
              </select>
              {vehicles.length === 0 && (
                <p className="mt-2 text-sm text-amber-700">
                  No vehicle assigned. Ask an officer to assign truck MH-12-AB-1234 to your driver account.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {!tracking ? (
                <Button onClick={start} disabled={!vehicleId}>
                  Start sharing location
                </Button>
              ) : (
                <Button variant="accent" onClick={stop}>
                  Stop sharing
                </Button>
              )}
            </div>
            <div className="rounded-lg bg-secondary/70 px-4 py-3 text-sm">
              Status:{" "}
              <strong className={tracking ? "text-emerald-700" : ""}>
                {tracking ? "LIVE" : "Idle"}
              </strong>
              {last && <div className="mt-1 text-muted-foreground">Last ping: {last}</div>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
