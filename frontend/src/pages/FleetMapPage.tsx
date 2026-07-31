import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { api, getToken } from "@/lib/api";
import { wsUrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/magic/effects";
import { useAuth } from "@/context/AuthContext";

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
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const prevRef = useRef<Record<number, { lat: number; lng: number }>>({});
  const list = Object.values(vehicles);

  useEffect(() => {
    api<LiveVehicle[]>("/api/fleet/live")
      .then((items) => {
        const map: Record<number, LiveVehicle> = {};
        items.forEach((i) => {
          map[i.vehicle_id] = i;
          prevRef.current[i.vehicle_id] = { lat: i.latitude, lng: i.longitude };
        });
        setVehicles(map);
      })
      .catch((e) => setError(e.message));

    const token = getToken();
    const ws = new WebSocket(`${wsUrl("/ws/fleet")}?token=${encodeURIComponent(token || "")}`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "location" && msg.data) {
          const d = msg.data as LiveVehicle;
          const prev = prevRef.current[d.vehicle_id];
          const next = { lat: d.latitude, lng: d.longitude };
          let deltaM = 0;
          if (prev) {
            deltaM = haversine(prev, next);
            // Show even slight moves (>= 0.5m)
            if (deltaM >= 0.5) {
              setEvents((e) =>
                [
                  {
                    id: `${d.vehicle_id}-${d.updated_at}`,
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
        }
      } catch {
        /* ignore */
      }
    };
    ws.onerror = () => setError("Live socket issue — refresh to reconnect");
    return () => ws.close();
  }, []);

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-semibold">Live fleet map</h1>
        <p className="text-muted-foreground">
          {user?.role === "driver"
            ? "Your GPS stream is visible city-wide while sharing."
            : "Everyone can watch trucks live. Tiny coordinate changes appear in the feed."}
        </p>
        <p className="mt-1 text-xs">
          WebSocket:{" "}
          <span className={connected ? "text-emerald-700 font-medium" : "text-amber-700"}>
            {connected ? "LIVE" : "connecting…"}
          </span>
        </p>
      </FadeIn>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">
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
            <CardTitle className="text-lg">Coordinate change feed</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[480px] space-y-2 overflow-y-auto">
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">Moves ≥ 0.5m will appear here live.</p>
            )}
            {events.map((e) => (
              <div key={e.id} className="rounded-lg bg-secondary/60 px-3 py-2 text-xs">
                <div className="font-medium">{e.label}</div>
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
