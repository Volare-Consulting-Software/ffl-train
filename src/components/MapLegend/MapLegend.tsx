const ITEMS = [
  { label: "Charlotte", swatch: "bg-fg" },
  { label: "Layover", swatch: "bg-warning" },
  { label: "Destination", swatch: "bg-brand" },
  { label: "Other picks", swatch: "bg-fg-muted" },
] as const;

/** Names each marker color so the map never relies on color alone, and carries the required map data credit. */
export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-fg-secondary">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${item.swatch}`} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-fg-muted hover:underline">
        Map data © OpenStreetMap contributors
      </a>
    </div>
  );
}
