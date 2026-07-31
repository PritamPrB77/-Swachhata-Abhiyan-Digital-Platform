import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/magic/effects";
import { useAuth } from "@/context/AuthContext";
import { socketLabel, socketTone, useFleetSocket } from "@/hooks/useFleetSocket";

type LiveVehicle = {
  vehicle_id: number;
  plate_number: string;
  label: string;
  ward: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  updated_at: string;
};

type CoordEvent = {
  id: string;
  vehicle_id: number;
  label: string;
  lat: number;
  lng: number;
  deltaM: number;
  at: string;
};

const truckIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: L.point(25, 41),
  iconAnchor: L.point(12, 41),
});

const PUNE = { lat: 18.5204, lng: 73.8567 };

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function FitBounds({ vehicles }: { vehicles: LiveVehicle[] }) {
  const map = useMap();
  useEffect(() => {
    if (vehicles.length === 0) return;
    const bounds = L.latLngBounds(vehicles.map((v) => [v.latitude, v.longitude]));
    map.fitBounds(bounds.pad(0.25));
  }, [vehicles.length, map]);
  return null;
}

export function FleetMapPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Record<number, LiveVehicle>>({});
  const [events, setEvents] = useState<CoordEvent[]>([]);
  const [restError, setRestError] = useState("");
  const prevRef = useRef<Record<number, { lat: number; lng: number }>>({});
  const list = Object.values(vehicles);

  const loadSnapshot = useCallback(() => {
    api<LiveVehicle[]>("/api/fleet/live")
      .then((items) => {
        const map: Record<number, LiveVehicle> = {};
        items.forEach((i) => {
          map[i.vehicle_id] = i;
          prevRef.current[i.vehicle_id] = { lat: i.latitude, lng: i.longitude };
        });
        setVehicles(map);
        setRestError("");
      })
      .catch((e) => setRestError(e.message));
  }, []);

  useEffect(() => {
    loadSnapshot();
    const id = window.setInterval(loadSnapshot, 15000);
    return () => window.clearInterval(id);
  }, [loadSnapshot]);

  const onMessage = useCallback((raw: unknown) => {
    const msg = raw as { type?: string; data?: LiveVehicle };
    if (msg.type !== "location" || !msg.data) return;
    const d = msg.data;
    const prev = prevRef.current[d.vehicle_id];
    const next = { lat: d.latitude, lng: d.longitude };
    if (prev) {
      const deltaM = haversine(prev, next);
      if (deltaM >= 0.5) {
        setEvents((e) =>
          [
            {
              id: `${d.vehicle_id}-${d.updated_at}-${deltaM}`,
              vehicle_id: d.vehicle_id,
              label: d.label,
              lat: d.latitude,
              lng: d.longitude,
              deltaM,
              at: new Date().toLocaleTimeString(),
            },
            ...e,
          ].slice(0, 40),
        );
      }
    }
    prevRef.current[d.vehicle_id] = next;
    setVehicles((p) => ({ ...p, [d.vehicle_id]: d }));
  }, []);

  const { state, attempt, lastError, reconnectNow } = useFleetSocket({ onMessage });

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-bold text-foreground">Live fleet map</h1>
        <p className="mt-1 text-base text-muted-foreground">
          {user?.role === "driver"
            ? "Your GPS stream is visible city-wide while sharing."
            : "Everyone can watch trucks live. Tiny coordinate changes appear in the feed."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span>
            WebSocket: <span className={socketTone(state)}>{socketLabel(state, attempt)}</span>
          </span>
          {state !== "connected" && (
            <Button type="button" size="sm" variant="outline" onClick={reconnectNow}>
              Retry now
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={loadSnapshot}>
            Refresh snapshot
          </Button>
        </div>
        {lastError && state !== "connected" && (
          <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">{lastError}</p>
        )}
        {restError && <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{restError}</p>}
      </FadeIn>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">
              {list.length} active {list.length === 1 ? "vehicle" : "vehicles"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[480px] overflow-hidden rounded-xl ring-1 ring-border">
              <MapContainer center={[PUNE.lat, PUNE.lng]} zoom={12} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds vehicles={list} />
                {list.map((v) => (
                  <Marker key={v.vehicle_id} position={[v.latitude, v.longitude]} icon={truckIcon}>
                    <Popup>
                      <strong>{v.label}</strong>
                      <br />
                      {v.plate_number}
                      <br />
                      Driver: {v.driver_name || "—"}
                      <br />
                      {v.latitude.toFixed(6)}, {v.longitude.toFixed(6)}
                      <br />
                      Updated: {new Date(v.updated_at).toLocaleTimeString()}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            {list.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Waiting for driver GPS. Ask a field worker to open Share GPS.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Coordinate change feed</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[480px] space-y-2 overflow-y-auto">
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">Moves ≥ 0.5m will appear here live.</p>
            )}
            {events.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground">
                <div className="font-semibold">{e.label}</div>
                <div className="text-muted-foreground">
                  Δ {e.deltaM.toFixed(1)} m · {e.lat.toFixed(6)}, {e.lng.toFixed(6)}
                </div>
                <div className="text-muted-foreground">{e.at}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
