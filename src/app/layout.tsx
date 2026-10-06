import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

import { PoweredByVolare } from "@/components/PoweredByVolare/PoweredByVolare";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Fantasy Football Train Ride",
  description: "Track the fantasy league last-place train trip destinations from Charlotte.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <PoweredByVolare />
      </body>
    </html>
  );
}
