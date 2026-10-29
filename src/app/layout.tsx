import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import { InViewAnimations } from "@/components/fx/InViewAnimations";
import { data } from "@/lib/data";
import "./globals.css";

// Display / headings. Vietnamese subset kept for the name's diacritics.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "vietnamese"],
});

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "vietnamese"] });

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL(data.meta.siteUrl),
  title: data.meta.title,
  description: data.meta.description,
  openGraph: {
    title: data.meta.title,
    description: data.meta.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1012",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={data.meta.lang} className={`${interTight.variable} ${geist.variable} ${geistMono.variable} antialiased`}>
      <body>
        {children}
        <InViewAnimations />
      </body>
    </html>
  );
}
