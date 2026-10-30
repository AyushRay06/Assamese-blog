import { PrismaClient, Language, PostStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function getRecoveredArticleInnerHtml(slug: string): string {
  const filePath = path.join(process.cwd(), ".next/server/app/blog", `${slug}.html`);
  if (!fs.existsSync(filePath)) return "";
  const html = fs.readFileSync(filePath, "utf8");
  const article = html.match(/<article[\s\S]*?<\/article>/)?.[0] || "";
  const proseIdx = article.indexOf("prose");
  if (proseIdx !== -1) {
    const closingIdx = article.indexOf(">", proseIdx);
    return article.substring(closingIdx + 1, article.lastIndexOf("</div></div></article>")).trim();
  }
  return "";
}

async function main() {
  console.log("Starting restoration to new database...");

  // 1. Tags
  const tagNames = [
    "Artificial Intelligence",
    "Game Theory",
    "Research Ethics",
    "Assamese",
    "Performing Arts",
    "Bihu",
    "Culture",
    "Philosophy",
    "Essays",
    "Mathematics",
    "Academic",
    "Web Design",
    "Digital Preservation",
  ];

  const tagMap = new Map<string, string>();
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagMap.set(name, tag.id);
  }

  // 2. Recovered Long-form Essay 1: Chicken Game AI
  const chickenHtml = getRecoveredArticleInnerHtml("post-2026-10-11-v4vitm");
  await prisma.post.upsert({
    where: { slug: "post-2026-10-11-v4vitm" },
    update: {},
    create: {
      title: "কৃত্ৰিম সাধাৰণ বুদ্ধিমত্তাৰ দৌৰ -- The Game of Chicken",
      slug: "post-2026-10-11-v4vitm",
      excerpt: "An article published in the Assamese daily -- আমাৰ অসম on 21 September 2026 explaining the strategic dynamics of the race towards Artificial General Intelligence through Game Theory.",
      coverImage: "https://bcworqqhfoo1surn.public.blob.vercel-storage.com/posts/cover-image-1791709121595-5qqg98.webp",
      language: Language.AS,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-09-21T06:00:00.000Z"),
      readingTime: 7,
      likes: 14,
      contentHtml: chickenHtml,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "কৃত্ৰিম সাধাৰণ বুদ্ধিমত্তা (Artificial General Intelligence) আৰু গেম থিয়ৰীৰ সম্পৰ্ক।" }],
          },
        ],
      },
      tags: {
        connect: [
          { id: tagMap.get("Artificial Intelligence")! },
          { id: tagMap.get("Game Theory")! },
          { id: tagMap.get("Assamese")! },
        ],
      },
    },
  });

  // 3. Recovered Long-form Essay 2: Bihu Performing Arts
  const bihuHtml = getRecoveredArticleInnerHtml("priwexz-klar-drixtire-bihur-oitihz-aru-biwrtn");
  await prisma.post.upsert({
    where: { slug: "priwexz-klar-drixtire-bihur-oitihz-aru-biwrtn" },
    update: {},
    create: {
      title: "পৰিৱেশ্য কলাৰ দৃষ্টিৰে বিহুৰ ঐতিহ্য আৰু বিৱৰ্তন",
      slug: "priwexz-klar-drixtire-bihur-oitihz-aru-biwrtn",
      excerpt: "ডিব্ৰুগড় বিশ্ববিদ্যালয়ৰ ড॰ ভূপেন হাজৰিকা পৰিৱেশ্য কলা অধ্যয়ন কেন্দ্ৰ আৰু বিহু সুৰক্ষা সমিতিয়ে যুটীয়াভাৱে আয়োজন কৰা আলোচনা চক্ৰৰ মূল ভাষণ।",
      coverImage: "https://bcworqqhfoo1surn.public.blob.vercel-storage.com/posts/cover-image-1791699203367-ceczsm.webp",
      language: Language.AS,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-09-25T06:00:00.000Z"),
      readingTime: 6,
      likes: 19,
      contentHtml: bihuHtml,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "পৰিৱেশ্য কলাৰ দৃষ্টিৰে বিহুৰ ঐতিহ্য আৰু বিৱৰ্তন।" }],
          },
        ],
      },
      tags: {
        connect: [
          { id: tagMap.get("Performing Arts")! },
          { id: tagMap.get("Bihu")! },
          { id: tagMap.get("Culture")! },
          { id: tagMap.get("Assamese")! },
        ],
      },
    },
  });

  // 4. Recovered Long-form Essay 3: Research Ethics and AI
  const ethicsHtml = getRecoveredArticleInnerHtml("gwexnat-noitiktar-przojneezta-aru-kritrim-buddhimtta-ai");
  await prisma.post.upsert({
    where: { slug: "gwexnat-noitiktar-przojneezta-aru-kritrim-buddhimtta-ai" },
    update: {},
    create: {
      title: "গৱেষণাত নৈতিকতাৰ প্ৰয়োজনীয়তা আৰু কৃত্ৰিম বুদ্ধিমত্তা (AI)",
      slug: "gwexnat-noitiktar-przojneezta-aru-kritrim-buddhimtta-ai",
      excerpt: "An Essay on the ethical Issues in Research in the Era of AI — জগন্নাথ বৰুৱা বিশ্ববিদ্যালয়ত অনুষ্ঠিত এখনি কৰ্মশালাৰ উদ্বোধনী ভাষণ।",
      coverImage: "https://bcworqqhfoo1surn.public.blob.vercel-storage.com/posts/cover-image-1791706263685-7lh5vh.webp",
      language: Language.AS,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-09-28T06:00:00.000Z"),
      readingTime: 7,
      likes: 22,
      contentHtml: ethicsHtml,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "গৱেষণাত নৈতিকতাৰ প্ৰয়োজনীয়তা আৰু কৃত্ৰিম বুদ্ধিমত্তা।" }],
          },
        ],
      },
      tags: {
        connect: [
          { id: tagMap.get("Research Ethics")! },
          { id: tagMap.get("Artificial Intelligence")! },
          { id: tagMap.get("Academic")! },
          { id: tagMap.get("Assamese")! },
        ],
      },
    },
  });

  // 5. English Post: Solitude
  await prisma.post.upsert({
    where: { slug: "quiet-art-solitude-deep-thinking" },
    update: {},
    create: {
      title: "The Quiet Art of Solitude and Deep Thinking",
      slug: "quiet-art-solitude-deep-thinking",
      excerpt: "Why carving out silent pockets in a hyperconnected world remains our most essential cognitive discipline.",
      coverImage: "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&w=1200&q=80",
      language: Language.EN,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-09-29T10:00:00.000Z"),
      readingTime: 5,
      likes: 16,
      contentHtml: `
        <p>In our relentlessly noisy world, silence is no longer an absence of sound; it has transformed into a deliberate choice, an act of quiet rebellion against the attention economy.</p>
        <h2>The Architecture of Uninterrupted Time</h2>
        <p>When Blaise Pascal famously observed that all of humanity's problems stem from our inability to sit quietly in a room alone, he could hardly have anticipated the pocket-sized supercomputers perpetually vibrating with global urgency.</p>
        <p>True depth requires cognitive spaciousness. Deep work, sustained contemplation, and nuanced synthesis cannot occur in three-minute fragments between push notifications.</p>
        <blockquote>Solitude is not isolation; it is the presence of oneself. In stillness, the sediment of everyday distraction settles, leaving the water clear enough to see through.</blockquote>
        <h2>Cultivating Intentional Stillness</h2>
        <p>Reclaiming cognitive autonomy begins with boundary creation: scheduled morning hours without email, long walks without audiobooks, and honoring boredom as the crucible of authentic creative thought.</p>
      `,
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "The Quiet Art of Solitude and Deep Thinking" }] }],
      },
      tags: {
        connect: [
          { id: tagMap.get("Philosophy")! },
          { id: tagMap.get("Essays")! },
        ],
      },
    },
  });

  // 6. Assamese Post: Borluit
  await prisma.post.upsert({
    where: { slug: "borluit-paror-aabeli-smriti" },
    update: {},
    create: {
      title: "বৰলুইতৰ পাৰৰ আবেলি আৰু কিছু স্মৃতি",
      slug: "borluit-paror-aabeli-smriti",
      excerpt: "ব্ৰহ্মপুত্ৰৰ বুকুত বিলীন হোৱা ৰঙচুৱা বেলিটো আৰু শৈশৱৰ হেৰুৱা দিনবোৰৰ এক নষ্টালজিক স্মৃতিচাৰণ।",
      coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      language: Language.AS,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-09-26T14:30:00.000Z"),
      readingTime: 4,
      likes: 27,
      contentHtml: `
        <p>আবেলিৰ বেলিটো লাহে লাহে বৰলুইতৰ বুকুত ডুব যাবলৈ ধৰিছে। ঘাটৰ পৰা ভাঁহি অহা নাৱৰীয়াৰ গান আৰু বতাহত কঁপি থকা কঁহুৱা বনবোৰে মনটো লৈ যায় বহু দূৰৰ এক অচিন দেশলৈ।</p>
        <h2>সময়ৰ সোঁতত পাহৰণিৰ ক্ষণ</h2>
        <p>লুইতৰ পাৰত বহিলেই মনত পৰে সেই দিনবোৰলৈ — যেতিয়া জীৱনটো আছিল নদীখনৰ দৰেই শান্ত আৰু সুৰীয়া। কোনো কৃত্ৰিম ব্যস্ততা নাছিল, নাছিল আধুনিকতাৰ ক্লান্তি। আছিল মাথোঁ বতাহৰ সুহুৰি আৰু বালিচৰত খোজ কঢ়াৰ তৃপ্তি।</p>
        <blockquote>নৈ কেৱল পানীৰ ধাৰা নহয়, নৈ হৈছে আমাৰ ইতিহাস, সংস্কৃতি আৰু আত্মচেতনাৰ এক অবিচ্ছেদ্য প্ৰবাহ।</blockquote>
      `,
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "বৰলুইতৰ পাৰৰ আবেলি আৰু কিছু স্মৃতি" }] }],
      },
      tags: {
        connect: [
          { id: tagMap.get("Assamese")! },
          { id: tagMap.get("Culture")! },
        ],
      },
    },
  });

  // 7. English Post: Digital Artifacts
  await prisma.post.upsert({
    where: { slug: "crafting-enduring-digital-artifacts" },
    update: {},
    create: {
      title: "Crafting Enduring Digital Artifacts",
      slug: "crafting-enduring-digital-artifacts",
      excerpt: "Moving beyond ephemeral web experiences to build tools, essays, and spaces that gracefully outlive the current framework cycle.",
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      language: Language.EN,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-09-23T08:15:00.000Z"),
      readingTime: 6,
      likes: 18,
      contentHtml: `
        <p>The contemporary web suffers from an existential brevity. Websites crumble into 404 errors within thirty-six months; design systems are discarded with the changing seasons; frameworks deprecate APIs before documentation can mature.</p>
        <h2>Building for the Century, Not the Sprint</h2>
        <p>What would it mean to engineer digital software with the longevity of stone masonry? To choose semantic HTML, standard web primitives, and durable data representations over ephemeral layer abstractions.</p>
        <p>When an artifact is built on timeless standards, it requires minimal maintenance while continually compounding its value over decades.</p>
      `,
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Crafting Enduring Digital Artifacts" }] }],
      },
      tags: {
        connect: [
          { id: tagMap.get("Web Design")! },
          { id: tagMap.get("Digital Preservation")! },
        ],
      },
    },
  });

  // 8. Assamese Post: Matribhasha
  await prisma.post.upsert({
    where: { slug: "digital-jugot-matribhashar-prosar" },
    update: {},
    create: {
      title: "ডিজিটেল যুগত মাতৃভাষাৰ গুৰুত্ব আৰু প্ৰসাৰ",
      slug: "digital-jugot-matribhashar-prosar",
      excerpt: "ইণ্টাৰনেট আৰু কৃত্ৰিম বুদ্ধিমত্তাৰ যুগত অসমীয়া ভাষাৰ ডিজিটেল অস্তিত্ব সুদৃঢ় কৰাৰ প্ৰত্যাহ্বান আৰু সম্ভাৱনা।",
      coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
      language: Language.AS,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-09-19T11:00:00.000Z"),
      readingTime: 5,
      likes: 31,
      contentHtml: `
        <p>একবিংশ শতিকাৰ বিজ্ঞান-প্ৰযুক্তিৰ ধামখুমীয়াত বিশ্বৰ বহুতো আঞ্চলিক ভাষা বিলুপ্তিৰ দিশে গতি কৰিছে। এই সন্ধিক্ষণত অসমীয়া ভাষাটো ডিজিটেল জগতত জীয়াই ৰখাটো কেৱল এক আৱেগিক বিষয় নহয়, বৰং এক বৌদ্ধিক দায়িত্ব।</p>
        <h2>ডিজিটেল সংৰক্ষণ আৰু প্ৰযুক্তিগত প্ৰয়োগ</h2>
        <p>অনলাইন বিশ্বকোষ, ইউনিক’ড ফন্ট আৰু কৃত্ৰিম বুদ্ধিমত্তাৰ জৰিয়তে অসমীয়া ভাষাক নৱপ্ৰজন্মৰ বাবে সহজগম্য কৰি তোলাৰ সময় আহি পৰিছে।</p>
      `,
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "ডিজিটেল যুগত মাতৃভাষাৰ গুৰুত্ব আৰু প্ৰসাৰ" }] }],
      },
      tags: {
        connect: [
          { id: tagMap.get("Assamese")! },
          { id: tagMap.get("Culture")! },
        ],
      },
    },
  });

  // 9. Cooperative Game Theory Research Post
  await prisma.post.upsert({
    where: { slug: "cooperative-game-theory-mathematical-models" },
    update: {},
    create: {
      title: "Cooperative Game Theory: Mathematical Models & Applications",
      slug: "cooperative-game-theory-mathematical-models",
      excerpt: "Strategic coalitions, payoff allocations, and mathematical formulations governing resource distribution across networks.",
      coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
      language: Language.EN,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-10-05T06:00:00.000Z"),
      readingTime: 8,
      likes: 25,
      contentHtml: `
        <p>Cooperative game theory provides rigorous axiomatic frameworks to model situations where rational decision-makers can achieve collective mutual benefits by forming strategic coalitions.</p>
        <h2>The Core and the Shapley Value</h2>
        <p>At the center of cooperative analysis lies the question of equitable distribution: how should the aggregate payoff of a grand coalition be allocated among participating agents according to their marginal contributions?</p>
        <p>Through concepts such as the Core, the Shapley Value, and the Nucleolus, cooperative game theory resolves complex conflicts in economic networks, multi-agent systems, and joint venture governance.</p>
      `,
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Cooperative Game Theory: Mathematical Models" }] }],
      },
      tags: {
        connect: [
          { id: tagMap.get("Game Theory")! },
          { id: tagMap.get("Mathematics")! },
          { id: tagMap.get("Academic")! },
        ],
      },
    },
  });

  // 10. Singleton site visitor counter baseline
  await prisma.siteVisitor.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      baseCount: 18450,
      extraVisits: 84,
      lastUpdatedDate: "2026-10-29",
    },
  });

  console.log("Successfully restored all posts and site settings to the new database!");
}

main()
  .catch((e) => {
    console.error("Restoration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

