"use client";

import "leaflet/dist/leaflet.css";

import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

import { formatDuration, formatLocalTime } from "@/lib/format";
import type { LatLng } from "@/types/latLng";
import type { TripDetail } from "@/types/tripDetail";
import type { TripSummary } from "@/types/tripSummary";

const CHARLOTTE: LatLng = [35.2414, -80.8228];
const INITIAL_ZOOM = 5;
const COLORS = {
  origin: "#15803d",
  layover: "#d97706",
  destination: "#b91c1c",
  stop: "#475569",
  route: "#1d4ed8",
  otherDestination: "#94a3b8",
} as const;

export interface RouteMapProps {
  detail: TripDetail | null;
  summaries: TripSummary[];
}

/** Interactive map: scroll or pinch to zoom, drag to pan. Draws the selected route with origin, layover and destination markers. */
export function RouteMap({ detail, summaries }: RouteMapProps) {
  const itinerary = detail?.itinerary;
  const firstLeg = itinerary?.legs[0];
  const lastLeg = itinerary?.legs[itinerary.legs.length - 1];
  const path = itinerary?.legs.flatMap((leg) => leg.path) ?? [];

  return (
    <MapContainer center={CHARLOTTE} zoom={INITIAL_ZOOM} scrollWheelZoom className="h-full w-full" worldCopyJump>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {summaries
        .filter((summary) => summary.destination && summary.pick.id !== detail?.pick.id)
        .map((summary) => (
          <CircleMarker
            key={summary.pick.id}
            center={[summary.destination!.latitude, summary.destination!.longitude]}
            radius={5}
            pathOptions={{ color: COLORS.otherDestination, fillOpacity: 0.6 }}
          >
            <Tooltip>
              Week {summary.pick.week}: {summary.pick.destinationName}
            </Tooltip>
          </CircleMarker>
        ))}

      {itinerary?.legs.map((leg) => (
        <Polyline key={`${leg.trainNumber}-${leg.board.station.code}`} positions={leg.path} pathOptions={{ color: COLORS.route, weight: 4 }}>
          <Tooltip sticky>
            {leg.trainName} {leg.trainNumber}
          </Tooltip>
        </Polyline>
      ))}

      {itinerary?.legs.flatMap((leg) =>
        leg.intermediateStops.map((stop) => (
          <CircleMarker
            key={`${leg.trainNumber}-${stop.station.code}`}
            center={[stop.station.latitude, stop.station.longitude]}
            radius={3}
            pathOptions={{ color: COLORS.stop, fillOpacity: 1, weight: 1 }}
          >
            <Tooltip>
              {stop.station.name} · {formatLocalTime(stop.arrival, stop.station.timeZone)}
            </Tooltip>
          </CircleMarker>
        )),
      )}

      {itinerary?.layovers.map((layover) => (
        <CircleMarker
          key={`layover-${layover.station.code}`}
          center={[layover.station.latitude, layover.station.longitude]}
          radius={9}
          pathOptions={{ color: COLORS.layover, fillOpacity: 0.9 }}
        >
          <Popup>
            <strong>{layover.station.name}</strong>
            <br />
            Layover {formatDuration(layover.minutes)}
            <br />
            {layover.fromTrain} → {layover.toTrain}
          </Popup>
        </CircleMarker>
      ))}

      {firstLeg && (
        <CircleMarker
          center={[firstLeg.board.station.latitude, firstLeg.board.station.longitude]}
          radius={10}
          pathOptions={{ color: COLORS.origin, fillOpacity: 0.9 }}
        >
          <Popup>
            <strong>Start: {firstLeg.board.station.name}</strong>
            <br />
            Departs {formatLocalTime(firstLeg.board.departure, firstLeg.board.station.timeZone)}
          </Popup>
        </CircleMarker>
      )}

      {lastLeg && (
        <CircleMarker
          center={[lastLeg.alight.station.latitude, lastLeg.alight.station.longitude]}
          radius={10}
          pathOptions={{ color: COLORS.destination, fillOpacity: 0.9 }}
        >
          <Popup>
            <strong>Destination: {lastLeg.alight.station.name}</strong>
            <br />
            Arrives {formatLocalTime(lastLeg.alight.arrival, lastLeg.alight.station.timeZone)}
          </Popup>
        </CircleMarker>
      )}

      <FitToRoute path={path} />
    </MapContainer>
  );
}

function FitToRoute({ path }: { path: LatLng[] }) {
  const map = useMap();
  const first = path[0];
  const last = path[path.length - 1];
  const key = `${first?.join()}|${last?.join()}|${path.length}`;

  useEffect(() => {
    if (path.length >= 2) {
      map.fitBounds(latLngBounds(path), { padding: [24, 24] });
    }
    // Refit only when the route itself changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);

  return null;
}
