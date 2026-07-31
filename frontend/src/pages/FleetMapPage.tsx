import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { api, getToken } from "@/lib/api";
import { wsUrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/magic/effects";

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

const truckIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds({ vehicles }: { vehicles: LiveVehicle[] }) {
  const map = useMap();
  useEffect(() => {
    if (vehicles.length === 0) return;
    const bounds = L.latLngBounds(vehicles.map((v) => [v.latitude, v.longitude]));
    map.fitBounds(bounds.pad(0.2));
  }, [vehicles, map]);
  return null;
}

export function FleetMapPage() {
  const [vehicles, setVehicles] = useState<Record<number, LiveVehicle>>({});
  const [error, setError] = useState("");
  const list = Object.values(vehicles);

  useEffect(() => {
    api<LiveVehicle[]>("/api/fleet/live")
      .then((items) => {
        const map: Record<number, LiveVehicle> = {};
        items.forEach((i) => {
          map[i.vehicle_id] = i;
        });
        setVehicles(map);
      })
      .catch((e) => setError(e.message));

    const token = getToken();
    const ws = new WebSocket(`${wsUrl("/ws/fleet")}?token=${encodeURIComponent(token || "")}`);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "location" && msg.data) {
          const d = msg.data as LiveVehicle;
          setVehicles((prev) => ({ ...prev, [d.vehicle_id]: d }));
        }
      } catch {
        /* ignore */
      }
    };
    ws.onerror = () => setError("Live socket disconnected — refresh to reconnect");
    return () => ws.close();
  }, []);

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-display text-3xl font-semibold">Live fleet map</h1>
        <p className="text-muted-foreground">
          Positions update instantly as drivers share phone GPS over WebSocket.
        </p>
      </FadeIn>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <FadeIn delay={0.05}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {list.length} active {list.length === 1 ? "vehicle" : "vehicles"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[480px] overflow-hidden rounded-xl ring-1 ring-border">
              <MapContainer center={[18.5204, 73.8567]} zoom={12} scrollWheelZoom className="h-full w-full">
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
                      Ward: {v.ward}
                      <br />
                      Updated: {new Date(v.updated_at).toLocaleTimeString()}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            {list.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Waiting for driver pings. Sign in as driver and open Share GPS.
              </p>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
