import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Downloads from "@/components/Downloads";
import InstallNote from "@/components/InstallNote";
import Footer from "@/components/Footer";
import { getLatestRelease } from "@/lib/releases";

export default async function HomePage() {
  // Fetched server-side, ISR cached for 10 minutes (see lib/releases.ts).
  const release = await getLatestRelease();

  return (
    <>
      <Nav />
      <main>
        <Hero release={release} />
        <Features />
        <Downloads release={release} />
        <InstallNote />
      </main>
      <Footer />
    </>
  );
}
