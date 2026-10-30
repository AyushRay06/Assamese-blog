import { PrismaClient, Language, PostStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const englishPosts = [
    {
      title: "Cooperative Game Theory: Mathematical Models & Applications",
      slug: "cooperative-game-theory-mathematical-models",
      excerpt: "Strategic coalitions, payoff allocations, and mathematical formulations governing resource distribution across networks.",
      coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
      language: Language.EN,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-10-28T06:00:00.000Z"),
      readingTime: 8,
      likes: 4,
      contentHtml: "<p>Cooperative game theory provides rigorous axiomatic frameworks to model situations where rational decision-makers can achieve collective mutual benefits by forming strategic coalitions.</p><h2>The Core and the Shapley Value</h2><p>At the center of cooperative analysis lies the question of equitable distribution: how should the aggregate payoff of a grand coalition be allocated among participating agents according to their marginal contributions?</p><p>Through concepts such as the Core, the Shapley Value, and the Nucleolus, cooperative game theory resolves complex conflicts in economic networks, multi-agent systems, and joint venture governance.</p>",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Cooperative Game Theory: Mathematical Models & Applications" }] }] },
    },
    {
      title: "The Quiet Art of Solitude and Deep Thinking",
      slug: "quiet-art-solitude-deep-thinking",
      excerpt: "Why carving out silent pockets in a hyperconnected world remains our most essential cognitive discipline.",
      coverImage: "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&w=1200&q=80",
      language: Language.EN,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-10-27T10:00:00.000Z"),
      readingTime: 5,
      likes: 5,
      contentHtml: "<p>In our relentlessly noisy world, silence is no longer an absence of sound; it has transformed into a deliberate choice, an act of quiet rebellion against the attention economy.</p><h2>The Architecture of Uninterrupted Time</h2><p>When Blaise Pascal famously observed that all of humanity's problems stem from our inability to sit quietly in a room alone, he could hardly have anticipated the pocket-sized supercomputers perpetually vibrating with global urgency.</p><p>True depth requires cognitive spaciousness. Deep work, sustained contemplation, and nuanced synthesis cannot occur in three-minute fragments between push notifications.</p><blockquote>Solitude is not isolation; it is the presence of oneself. In stillness, the sediment of everyday distraction settles, leaving the water clear enough to see through.</blockquote>",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "The Quiet Art of Solitude and Deep Thinking" }] }] },
    },
    {
      title: "Crafting Enduring Digital Artifacts",
      slug: "crafting-enduring-digital-artifacts",
      excerpt: "Moving beyond ephemeral web experiences to build tools, essays, and spaces that gracefully outlive the current framework cycle.",
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      language: Language.EN,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-10-25T08:15:00.000Z"),
      readingTime: 6,
      likes: 4,
      contentHtml: "<p>The contemporary web suffers from an existential brevity. Websites crumble into 404 errors within thirty-six months; design systems are discarded with the changing seasons; frameworks deprecate APIs before documentation can mature.</p><h2>Building for the Century, Not the Sprint</h2><p>What would it mean to engineer digital software with the longevity of stone masonry? To choose semantic HTML, standard web primitives, and durable data representations over ephemeral layer abstractions.</p>",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Crafting Enduring Digital Artifacts" }] }] },
    },
  ];

  for (const p of englishPosts) {
    const post = await prisma.post.upsert({
      where: { slug: p.slug },
      update: {
        status: PostStatus.PUBLISHED,
        publishedAt: p.publishedAt,
        likes: p.likes,
      },
      create: p,
    });
    console.log("Upserted English post:", post.title);
  }

  const counts = {
    all: await prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    en: await prisma.post.count({ where: { status: PostStatus.PUBLISHED, language: Language.EN } }),
    as: await prisma.post.count({ where: { status: PostStatus.PUBLISHED, language: Language.AS } }),
  };
  console.log("New counts:", counts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
