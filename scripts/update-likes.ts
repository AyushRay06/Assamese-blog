import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// Organic distribution of likes between 1 and 5
const targetLikes = [4, 5, 3, 2, 5, 4, 3, 2, 5, 3, 4, 2, 4, 5, 3, 4];

async function main() {
  const posts = await prisma.post.findMany({
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, likes: true },
  });

  console.log(`Found ${posts.length} posts.`);
  for (let i = 0; i < posts.length; i++) {
    const likeVal = targetLikes[i % targetLikes.length];
    await prisma.post.update({
      where: { id: posts[i].id },
      data: { likes: likeVal },
    });
    console.log(`Updated "${posts[i].title}" likes: ${posts[i].likes} -> ${likeVal}`);
  }

  // Ensure site visitor singleton exists
  await prisma.siteVisitor.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      baseCount: 18450,
      extraVisits: 84,
      lastUpdatedDate: "2026-10-30",
    },
  });
  console.log("Site visitor initialized.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
