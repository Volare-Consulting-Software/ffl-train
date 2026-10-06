import Image from "next/image";

const VOLARE_URL = "https://go-volare.com";

/**
 * "Powered by Volare" credit in the bottom-right footer, matching the back office portal's watermark:
 * the transparent white logo turned solid black on light pages (brightness(0)) and left white on dark.
 */
export function PoweredByVolare() {
  return (
    <footer className="flex h-10 shrink-0 items-center justify-end px-5">
      <a
        href={VOLARE_URL}
        target="_blank"
        rel="noreferrer"
        className="flex select-none items-center gap-2 opacity-50 transition-opacity hover:opacity-80 focus-visible:opacity-80"
      >
        <span className="text-xs font-medium text-fg">Powered by</span>
        <Image
          src="/volare-logo.png"
          alt="Volare"
          width={48}
          height={20}
          className="h-5 w-auto brightness-0 dark:brightness-100"
        />
      </a>
    </footer>
  );
}
