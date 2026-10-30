import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ResearchSection } from "@/components/home/ResearchSection";
import { FellowshipsSection } from "@/components/home/FellowshipsSection";
import { BlogsSection } from "@/components/home/BlogsSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { ContactSection } from "@/components/home/ContactSection";
import { GridMarqueeDivider } from "@/components/ui/GridMarqueeDivider";
import { getCachedPublishedPosts } from "@/lib/posts";
import { getActiveSubscribersCount } from "@/lib/subscribers";
import { getLiveVisitorCount } from "@/lib/visitor-count";

export const revalidate = 60; // revalidate every 60s or on demand

export default async function HomePage() {
  const [{ posts }, subscriberCount, visitorStats] = await Promise.all([
    getCachedPublishedPosts(undefined, 1, 8),
    getActiveSubscribersCount().catch(() => 0),
    getLiveVisitorCount().catch(() => ({ totalCount: 1840 })),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <PublicHeader />

      <main className="flex-1">
        {/* 1. Academic Hero with Portrait & Blogs Marquee */}
        <HeroSection posts={posts} visitorCount={visitorStats.totalCount} />

        {/* Section Divider Marquee: Architectural straight-line grid pattern */}
        <GridMarqueeDivider />

        {/* 2. Blogs & Writings Gateway Section */}
        <BlogsSection initialPosts={posts.slice(0, 3)} totalCount={posts.length} />

        {/* Section Divider Marquee: Reverse scroll */}
        <GridMarqueeDivider reverse />

        {/* 3. Research Focus & Mathematical Work with Drawer Figure */}
        <ResearchSection />

        {/* Section Divider Marquee */}
        <GridMarqueeDivider />

        {/* 4. International Fellowships & Governance with Cabinet Figure */}
        <FellowshipsSection />

        {/* Section Divider Marquee: Reverse scroll */}
        <GridMarqueeDivider reverse />

        {/* 5. Subscription & Newsletter Section */}
        <NewsletterSection initialSubscriberCount={subscriberCount} />

        {/* Section Divider Marquee */}
        <GridMarqueeDivider />

        {/* 6. Aesthetic Contact Section with Riffle Figure */}
        <ContactSection />
      </main>

      <PublicFooter />
    </div>
  );
}
