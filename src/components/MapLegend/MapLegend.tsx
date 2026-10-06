const ITEMS = [
  { label: "Charlotte", swatch: "bg-fg" },
  { label: "Layover", swatch: "bg-warning" },
  { label: "Destination", swatch: "bg-brand" },
  { label: "Other picks", swatch: "bg-fg-muted" },
] as const;

/** Names each marker color so the map never relies on color alone. */
export function MapLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-secondary">
      {ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={`inline-block size-2.5 rounded-full ${item.swatch}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
