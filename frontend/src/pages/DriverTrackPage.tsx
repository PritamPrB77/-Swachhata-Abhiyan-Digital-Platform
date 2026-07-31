import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/magic/effects";
import { socketLabel, socketTone, useFleetSocket } from "@/hooks/useFleetSocket";

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
  const [last, setLast] = useState("");
  const [geoError, setGeoError] = useState("");
  const watchRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const vehicleIdRef = useRef<number | null>(null);
  vehicleIdRef.current = vehicleId;

  const { state, attempt, lastError, send, reconnectNow } = useFleetSocket({
    enabled: tracking,
    onMessage: () => undefined,
  });

  useEffect(() => {
    api<Vehicle[]>("/api/fleet/vehicles")
      .then((v) => {
        setVehicles(v);
        if (v[0]) setVehicleId(v[0].id);
      })
      .catch((e) => setGeoError(e.message));
    return () => stopWatch();
  }, []);

  function stopWatch() {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }

  function stop() {
    stopWatch();
    setTracking(false);
  }

  function start() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported in this browser");
      return;
    }
    if (!vehicleId) {
      setGeoError("Select an assigned vehicle first");
      return;
    }
    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const now = Date.now();
        const prev = lastSentRef.current;
        let shouldSend = !prev || now - prev.at >= 30_000;
        if (prev) {
          const R = 6371000;
          const toRad = (d: number) => (d * Math.PI) / 180;
          const dLat = toRad(lat - prev.lat);
          const dLng = toRad(lng - prev.lng);
          const s =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(prev.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
          const meters = 2 * R * Math.asin(Math.sqrt(s));
          if (meters >= 0.5) shouldSend = true;
        }
        if (!shouldSend) return;

        const payload = {
          type: "ping",
          vehicle_id: vehicleIdRef.current,
          latitude: lat,
          longitude: lng,
          speed: pos.coords.speed ?? 0,
          heading: pos.coords.heading ?? 0,
        };
        const viaWs = send(payload);
        // REST fallback always — keeps map alive if socket drops
        api("/api/fleet/location", {
          method: "POST",
          body: JSON.stringify(payload),
        }).catch(() => undefined);

        lastSentRef.current = { lat, lng, at: now };
        setLast(
          `${lat.toFixed(5)}, ${lng.toFixed(5)} @ ${new Date().toLocaleTimeString()}${viaWs ? " · WS" : " · REST"}`,
        );
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-bold text-foreground">Driver live GPS</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Your phone location is streamed live to officers. No separate GPS device required.
        </p>
      </FadeIn>
      <FadeIn delay={0.05}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Tracking controls</CardTitle>
            <CardDescription className="text-muted-foreground">
              Keep this page open while driving. Uses browser Geolocation + WebSocket (REST backup).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Assigned vehicle</label>
              <select
                className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm text-foreground"
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
                <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  No vehicle assigned. Ask an officer to assign a truck to your driver account.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {!tracking ? (
                <Button onClick={start} disabled={!vehicleId}>
                  Start sharing location
                </Button>
              ) : (
                <Button variant="accent" onClick={stop}>
                  Stop sharing
                </Button>
              )}
              {tracking && state !== "connected" && (
                <Button type="button" variant="outline" onClick={reconnectNow}>
                  Retry socket
                </Button>
              )}
            </div>
            <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
              <div>
                Status:{" "}
                <strong className={tracking ? "text-emerald-600 dark:text-emerald-400" : ""}>
                  {tracking ? "Sharing" : "Idle"}
                </strong>
              </div>
              {tracking && (
                <div className="mt-1">
                  WebSocket: <span className={socketTone(state)}>{socketLabel(state, attempt)}</span>
                </div>
              )}
              {last && <div className="mt-1 text-muted-foreground">Last ping: {last}</div>}
            </div>
            {tracking && lastError && state !== "connected" && (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {lastError} — GPS still posts via REST so the map stays updated.
              </p>
            )}
            {geoError && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{geoError}</p>}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
