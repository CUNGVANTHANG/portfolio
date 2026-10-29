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

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : data.meta.siteUrl);

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: data.meta.title,
  description: data.meta.description,
  openGraph: {
    title: data.meta.title,
    description: data.meta.description,
    type: "website",
    url: baseUrl,
    images: [
      {
        url: data.profile.avatar,
        alt: data.profile.name,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: data.meta.title,
    description: data.meta.description,
    images: [data.profile.avatar],
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
