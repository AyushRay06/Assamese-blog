import { PrismaClient, Language, PostStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up existing sample posts...");
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();

  console.log("Creating seed tags and posts...");

  // Post 1: English
  await prisma.post.create({
    data: {
      title: "The Quiet Art of Solitude and Deep Thinking",
      slug: "quiet-art-solitude-deep-thinking",
      excerpt: "Why carving out silent pockets in a hyperconnected world remains our most essential cognitive discipline.",
      coverImage: "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&w=1200&q=80",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "In our relentlessly noisy world, silence is no longer an absence of sound; it has transformed into a deliberate choice, an act of quiet rebellion against the attention economy.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "The Architecture of Uninterrupted Time" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "When we disconnect from infinite scrolls and constant notifications, our cognitive faculties begin to settle. New ideas require stillness to germinate. Without boredom or calm contemplation, we simply react rather than create.",
              },
            ],
          },
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "“All of humanity's problems stem from man's inability to sit quietly in a room alone.” — Blaise Pascal",
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Cultivating this space does not mean fleeing civilization. It means setting boundaries with our tools, keeping our screens intentional, and giving our minds space to wander across untamed thoughts.",
              },
            ],
          },
        ],
      },
      contentHtml: `
        <p>In our relentlessly noisy world, silence is no longer an absence of sound; it has transformed into a deliberate choice, an act of quiet rebellion against the attention economy.</p>
        <h2>The Architecture of Uninterrupted Time</h2>
        <p>When we disconnect from infinite scrolls and constant notifications, our cognitive faculties begin to settle. New ideas require stillness to germinate. Without boredom or calm contemplation, we simply react rather than create.</p>
        <blockquote><p>“All of humanity's problems stem from man's inability to sit quietly in a room alone.” — Blaise Pascal</p></blockquote>
        <p>Cultivating this space does not mean fleeing civilization. It means setting boundaries with our tools, keeping our screens intentional, and giving our minds space to wander across untamed thoughts.</p>
      `.trim(),
      language: Language.EN,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      readingTime: 3,
      tags: {
        create: [{ name: "Philosophy" }, { name: "Productivity" }],
      },
    },
  });

  // Post 2: Assamese
  await prisma.post.create({
    data: {
      title: "বৰলুইতৰ পাৰৰ আবেলি আৰু কিছু স্মৃতি",
      slug: "borluitor-paaror-aabeli-aru-kichu-smriti",
      excerpt: "লুইতৰ শান্ত জলৰাশিৰ বুকুত ডুব যোৱা বেলিটোৱে মনত পেলাই দিয়ে অতীতৰ পাহৰণিৰ বহু নোকোৱা সাধু।",
      coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "বৰলুইতৰ বিশাল পাৰত বহি যেতিয়া সন্ধিয়াৰ মলয়া বতাহজাক অনুভৱ কৰা যায়, সময় যেন এক মুহূৰ্তৰ বাবে থমকি ৰয়।",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "নদী আৰু জীৱনৰ গভীৰ সংযোগ" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "আমাৰ লোকসংস্কৃতি, গীত-মাত আৰু জীৱনবোধৰ লগত লুইতৰ সম্বন্ধ চিৰদিনীয়া। নদীৰ সোঁতে আমাক অবিৰাম আগুৱাই যাবলৈ শিকায়, বাধা-বিঘিনি নেওচি নিজৰ পথ নিজেই সৃষ্টি কৰিবলৈ সাহস যোগায়।",
              },
            ],
          },
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "“ব্ৰহ্মপুত্ৰৰ বুকুত আছে অসমীয়াৰ হৃদয়ৰ স্পন্দন আৰু সৃষ্টিৰ প্ৰাণশক্তি।”",
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "আবেলিৰ সেন্দুৰীয়া আকাশখন আৰু ৰূপালী নদীৰ ঢৌবোৰে মনলৈ এক অসীম প্ৰশান্তি কঢ়িয়াই আনে। এনে নিৰ্জনতাৰ মাজতেই মানুহে নিজক নতুনকৈ আৱিষ্কাৰ কৰিব পাৰে।",
              },
            ],
          },
        ],
      },
      contentHtml: `
        <p>বৰলুইতৰ বিশাল পাৰত বহি যেতিয়া সন্ধিয়াৰ মলয়া বতাহজাক অনুভৱ কৰা যায়, সময় যেন এক মুহূৰ্তৰ বাবে থমকি ৰয়।</p>
        <h2>নদী আৰু জীৱনৰ গভীৰ সংযোগ</h2>
        <p>আমাৰ লোকসংস্কৃতি, গীত-মাত আৰু জীৱনবোধৰ লগত লুইতৰ সম্বন্ধ চিৰদিনীয়া। নদীৰ সোঁতে আমাক অবিৰাম আগুৱাই যাবলৈ শিকায়, বাধা-বিঘিনি নেওচি নিজৰ পথ নিজেই সৃষ্টি কৰিবলৈ সাহস যোগায়।</p>
        <blockquote><p>“ব্ৰহ্মপুত্ৰৰ বুকুত আছে অসমীয়াৰ হৃদয়ৰ স্পন্দন আৰু সৃষ্টিৰ প্ৰাণশক্তি।”</p></blockquote>
        <p>আবেলিৰ সেন্দুৰীয়া আকাশখন আৰু ৰূপালী নদীৰ ঢৌবোৰে মনলৈ এক অসীম প্ৰশান্তি কঢ়িয়াই আনে। এনে নিৰ্জনতাৰ মাজতেই মানুহে নিজক নতুনকৈ আৱিষ্কাৰ কৰিব পাৰে।</p>
      `.trim(),
      language: Language.AS,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      readingTime: 3,
      tags: {
        create: [{ name: "অসমীয়া সাহিত্য" }, { name: "স্মৃতিচাৰণ" }],
      },
    },
  });

  // Post 3: English
  await prisma.post.create({
    data: {
      title: "Crafting Enduring Digital Artifacts",
      slug: "crafting-enduring-digital-artifacts",
      excerpt: "Software often decays, but thoughtful digital gardens and independent writing can endure for decades.",
      coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "When we write on proprietary social platforms, our words are fed into an algorithmic mill designed for fleeting virality. Owning your publishing channel restores agency.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "The Permanence of Personal Blogs" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A personal blog built on open web standards—HTML, CSS, RSS—outlives corporate networks. It is a slow, enduring library that reflects the genuine evolution of an individual mind over years.",
              },
            ],
          },
        ],
      },
      contentHtml: `
        <p>When we write on proprietary social platforms, our words are fed into an algorithmic mill designed for fleeting virality. Owning your publishing channel restores agency.</p>
        <h2>The Permanence of Personal Blogs</h2>
        <p>A personal blog built on open web standards—HTML, CSS, RSS—outlives corporate networks. It is a slow, enduring library that reflects the genuine evolution of an individual mind over years.</p>
      `.trim(),
      language: Language.EN,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
      readingTime: 2,
      tags: {
        create: [{ name: "Technology" }, { name: "Writing" }],
      },
    },
  });

  // Post 4: Assamese
  await prisma.post.create({
    data: {
      title: "ডিজিটেল যুগত মাতৃভাষাৰ গুৰুত্ব আৰু প্ৰসাৰ",
      slug: "digital-jugot-matribhashar-gurutwa",
      excerpt: "ইণ্টাৰনেট আৰু প্ৰযুক্তিৰ দ্ৰুত পৰিৱৰ্তনৰ মাজত কেনেকৈ আমাৰ ভাষাক বিশ্বমঞ্চত অধিক সমৃদ্ধ কৰিব পাৰি।",
      coverImage: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "আজিৰ আধুনিক যুগত প্ৰযুক্তিৰ ব্যৱহাৰ বৃদ্ধি পোৱাৰ লগে লগে নিজৰ ভাষাত ব্লগিং আৰু তথ্য সৃষ্টি কৰাটো অত্যন্ত জৰুৰী হৈ পৰিছে।",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "ইউনিক’ড আৰু অসমীয়া সমল" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "ইণ্টাৰনেটত অসমীয়া ভাষাত গুণগত সমল যিমানেই বৃদ্ধি পাব, সিমানেই আমাৰ ভাষা ডিজিটেল জগতত সুদৃঢ় হ’ব। আগন্তুক প্ৰজন্মৰ বাবে অনলাইন মাধ্যমেৰে জ্ঞান আহৰণ কৰাটো অধিক সহজ হৈ পৰিব।",
              },
            ],
          },
        ],
      },
      contentHtml: `
        <p>আজিৰ আধুনিক যুগত প্ৰযুক্তিৰ ব্যৱহাৰ বৃদ্ধি পোৱাৰ লগে লগে নিজৰ ভাষাত ব্লগিং আৰু তথ্য সৃষ্টি কৰাটো অত্যন্ত জৰুৰী হৈ পৰিছে।</p>
        <h2>ইউনিক’ড আৰু অসমীয়া সমল</h2>
        <p>ইণ্টাৰনেটত অসমীয়া ভাষাত গুণগত সমল যিমানেই বৃদ্ধি পাব, সিমানেই আমাৰ ভাষা ডিজিটেল জগতত সুদৃঢ় হ’ব। আগন্তুক প্ৰজন্মৰ বাবে অনলাইন মাধ্যমেৰে জ্ঞান আহৰণ কৰাটো অধিক সহজ হৈ পৰিব।</p>
      `.trim(),
      language: Language.AS,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      readingTime: 2,
      tags: {
        create: [{ name: "প্ৰযুক্তি" }],
      },
    },
  });

  // Post 5: Draft post (to verify drafts never leak publicly)
  await prisma.post.create({
    data: {
      title: "Unpublished Musings on Future Projects [DRAFT]",
      slug: "unpublished-musings-future-projects-draft",
      excerpt: "This is a private draft that must never be visible on public routes.",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Secret draft content that should only be visible in admin." }],
          },
        ],
      },
      contentHtml: "<p>Secret draft content that should only be visible in admin.</p>",
      language: Language.EN,
      status: PostStatus.DRAFT,
      publishedAt: null,
      readingTime: 1,
    },
  });

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
