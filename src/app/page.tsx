import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ResearchSection } from "@/components/home/ResearchSection";
import { FellowshipsSection } from "@/components/home/FellowshipsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { GridMarqueeDivider } from "@/components/ui/GridMarqueeDivider";

export const revalidate = 60; // revalidate every 60s or on demand

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <PublicHeader />

      <main className="flex-1">
        {/* 1. Academic Hero with Bookshelf Figure & Portrait */}
        <HeroSection />

        {/* Section Divider Marquee: Architectural straight-line grid pattern */}
        <GridMarqueeDivider />

        {/* 2. Research Focus & Mathematical Work with Drawer Figure */}
        <ResearchSection />

        {/* Section Divider Marquee: Reverse scroll */}
        <GridMarqueeDivider reverse />

        {/* 3. International Fellowships & Governance with Cabinet Figure */}
        <FellowshipsSection />

        {/* Section Divider Marquee */}
        <GridMarqueeDivider />

        {/* 4. Aesthetic Contact Section with Riffle Figure */}
        <ContactSection />
      </main>

      <PublicFooter />
    </div>
  );
}
