import Image from "next/image";

const VOLARE_URL = "https://go-volare.com";

/** "Powered by" credit with the Volare logo, linking to the Volare site (same treatment as the back office portal). */
export function PoweredByVolare() {
  return (
    <footer className="flex select-none flex-col items-center gap-2 py-8">
      <p className="text-xs font-medium tracking-wide text-fg-muted">Powered by</p>
      <a href={VOLARE_URL} target="_blank" rel="noreferrer" aria-label="Volare (opens go-volare.com)" className="rounded-md">
        <Image src="/volare-logo.png" alt="Volare" width={96} height={40} className="h-10 w-auto rounded-md opacity-90 hover:opacity-100" />
      </a>
    </footer>
  );
}
