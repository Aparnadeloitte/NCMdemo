import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./portal.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const inter = Inter({ subsets: ["latin"], weight: ["700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NCM 2.0 | MIS-MRV Portal",
  description:
    "National Coastal Mission 2.0 monitoring, protecting and restoring India's coastal ecosystems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.className} ${inter.variable}`}>{children}</body>
    </html>
  );
}
