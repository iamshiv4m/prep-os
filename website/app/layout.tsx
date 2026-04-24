import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { APP, REPO_URL, RELEASES_URL, SITE_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_TITLE = `${APP.name} — ${APP.tagline}`;
const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${APP.name} — ${APP.tagline}`,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${APP.name}`,
  },
  description: APP.description,
  applicationName: APP.name,
  authors: [{ name: APP.author.name, url: APP.author.url }],
  creator: APP.author.name,
  publisher: APP.author.name,
  category: "technology",
  keywords: [
    "interview prep",
    "DSA",
    "leetcode",
    "system design",
    "coding interview",
    "placement preparation",
    "India interview prep",
    "daily.dev alternative",
    "electron app",
    "macOS desktop app",
    "focus mode",
    "AI interview prep",
    "developer tools",
    "frontend interview",
    "PrepOS",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: APP.name,
    title: SITE_TITLE,
    description: APP.description,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: APP.description,
    creator: APP.twitter,
    site: APP.twitter,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Favicons & apple-touch-icon are auto-detected from app/icon.svg and
  // app/apple-icon.png via Next.js file-convention. public/icon.png (1024×)
  // is referenced separately by the Organization JSON-LD below.
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: APP.name,
  operatingSystem: "macOS, Windows, Linux",
  applicationCategory: "ProductivityApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  downloadUrl: RELEASES_URL,
  softwareVersion: APP.version,
  url: SITE_URL,
  image: `${SITE_URL}/og.png`,
  description: APP.description,
  author: {
    "@type": "Person",
    name: APP.author.name,
    url: APP.author.url,
  },
  license: `${REPO_URL}/blob/main/LICENSE`,
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: APP.name,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  sameAs: [REPO_URL],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="me" href={APP.author.url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationLd),
          }}
        />
      </head>
      <body className="relative min-h-screen overflow-x-hidden font-sans antialiased">
        <noscript>
          <div
            style={{
              maxWidth: 720,
              margin: "48px auto",
              padding: 24,
              fontFamily: "system-ui, sans-serif",
              color: "#f4f4f7",
            }}
          >
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>{APP.name}</h1>
            <p style={{ lineHeight: 1.6, color: "#a3a3b3" }}>{APP.shortDescription}</p>
            <p style={{ marginTop: 16 }}>
              <a href={RELEASES_URL} style={{ color: "#a78bfa" }}>
                Download the latest release on GitHub →
              </a>
            </p>
            <p style={{ marginTop: 8, fontSize: 13, color: "#6f6f80" }}>
              JavaScript is required for the full landing page experience, but every download link
              works without it.
            </p>
          </div>
        </noscript>
        <div className="relative z-10">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
