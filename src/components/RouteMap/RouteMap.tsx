"use client";

import "leaflet/dist/leaflet.css";

import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

import { usePrefersDark } from "@/hooks/usePrefersDark";
import { formatDuration, formatLocalTime } from "@/lib/format";
import type { LatLng } from "@/types/latLng";
import type { TripDetail } from "@/types/tripDetail";
import type { TripSummary } from "@/types/tripSummary";

const CHARLOTTE: LatLng = [35.2414, -80.8228];
const INITIAL_ZOOM = 5;
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Brand colors per theme. On dark, ECU Purple is only used as a fill, never as a line (volare-brand dark-theme.md). */
const MAP_COLORS = {
  light: { route: "#5e27d2", origin: "#1a1625", destination: "#5e27d2", layover: "#b86e00", stop: "#6e6982", other: "#9c97aa", ring: "#ffffff" },
  dark: { route: "#f1f0f4", origin: "#f1f0f4", destination: "#5e27d2", layover: "#e0a341", stop: "#c9c5d2", other: "#6e6982", ring: "#0e0b17" },
} as const;

export interface RouteMapProps {
  detail: TripDetail | null;
  summaries: TripSummary[];
}

/** Interactive map: scroll or pinch to zoom, drag to pan. Draws the selected route with origin, layover and destination markers. */
export function RouteMap({ detail, summaries }: RouteMapProps) {
  const prefersDark = usePrefersDark();
  const theme = prefersDark ? "dark" : "light";
  const colors = MAP_COLORS[theme];
  const itinerary = detail?.itinerary;
  const firstLeg = itinerary?.legs[0];
  const lastLeg = itinerary?.legs[itinerary.legs.length - 1];
  const path = itinerary?.legs.flatMap((leg) => leg.path) ?? [];

  return (
    <MapContainer center={CHARLOTTE} zoom={INITIAL_ZOOM} scrollWheelZoom worldCopyJump className={`h-full w-full map-monochrome-${theme}`}>
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={19} />

      {summaries
        .filter((summary) => summary.destination && summary.pick.id !== detail?.pick.id)
        .map((summary) => (
          <CircleMarker
            key={summary.pick.id}
            center={[summary.destination!.latitude, summary.destination!.longitude]}
            radius={5}
            pathOptions={{ color: colors.other, fillColor: colors.other, fillOpacity: 0.7, weight: 1 }}
          >
            <Tooltip>
              {summary.pick.destinationName} · {summary.pick.pickerName}
            </Tooltip>
          </CircleMarker>
        ))}

      {itinerary?.legs.map((leg) => (
        <Polyline
          key={`${leg.trainNumber}-${leg.board.station.code}`}
          positions={leg.path}
          pathOptions={{ color: colors.route, weight: 4, opacity: 0.9 }}
        >
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
            pathOptions={{ color: colors.ring, fillColor: colors.stop, fillOpacity: 1, weight: 1 }}
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
          pathOptions={{ color: colors.ring, fillColor: colors.layover, fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <strong>Layover: {layover.station.name}</strong>
            <br />
            {formatDuration(layover.minutes)} · {layover.fromTrain} to {layover.toTrain}
          </Popup>
        </CircleMarker>
      ))}

      {firstLeg && (
        <CircleMarker
          center={[firstLeg.board.station.latitude, firstLeg.board.station.longitude]}
          radius={10}
          pathOptions={{ color: colors.ring, fillColor: colors.origin, fillOpacity: 1, weight: 2 }}
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
          pathOptions={{ color: colors.ring, fillColor: colors.destination, fillOpacity: 1, weight: 2 }}
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
