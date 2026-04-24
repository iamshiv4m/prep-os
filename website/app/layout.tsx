import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { APP, REPO_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prepos.app"),
  title: {
    default: `${APP.name} — ${APP.tagline}`,
    template: `%s · ${APP.name}`,
  },
  description: APP.description,
  applicationName: APP.name,
  authors: [{ name: "Shivam Jha", url: REPO_URL }],
  keywords: [
    "interview prep",
    "DSA",
    "leetcode",
    "system design",
    "developer tools",
    "electron app",
    "macOS desktop",
    "focus mode",
    "AI chat",
    "PrepOS",
  ],
  openGraph: {
    type: "website",
    title: `${APP.name} — ${APP.tagline}`,
    description: APP.description,
    siteName: APP.name,
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP.name} — ${APP.tagline}`,
    description: APP.description,
    creator: APP.twitter,
    images: ["/og.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="relative min-h-screen overflow-x-hidden font-sans antialiased">
        <div className="relative z-10">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
