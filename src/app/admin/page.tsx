import { getAllPostsAdmin } from "@/lib/posts";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { getLiveVisitorCount } from "@/lib/visitor-count";
import { getAllCommentsForAdmin } from "@/lib/comments";

interface AdminDashboardProps {
  searchParams: Promise<{
    search?: string;
    status?: "DRAFT" | "PUBLISHED";
    language?: "EN" | "AS";
    tab?: "posts" | "messages" | "comments";
  }>;
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  const params = await searchParams;

  let posts: Awaited<ReturnType<typeof getAllPostsAdmin>> = [];
  let contactMessages: Awaited<ReturnType<typeof prisma.contactMessage.findMany>> = [];
  let comments: Awaited<ReturnType<typeof getAllCommentsForAdmin>> = [];
  let stats = {
    totalPostsCount: 0,
    publishedCount: 0,
    draftCount: 0,
    assameseCount: 0,
    englishCount: 0,
    unreadMessagesCount: 0,
    totalMessagesCount: 0,
    totalVisitors: 0,
    todayVisitorGrowth: 0,
    totalSubscribers: 0,
    totalCommentsCount: 0,
  };

  if (process.env.DATABASE_URL) {
    try {
      // Execute fast concurrent queries instead of multiple round trips
      const [
        postStats,
        messageStats,
        fetchedPosts,
        fetchedMessages,
        visitorStats,
        subscriberCount,
        fetchedComments,
        commentCount,
      ] = await Promise.all([
        prisma.post.groupBy({
          by: ["status", "language"],
          _count: { id: true },
        }),
        prisma.contactMessage.groupBy({
          by: ["status"],
          _count: { id: true },
        }),
        getAllPostsAdmin(),
        prisma.contactMessage.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        getLiveVisitorCount(),
        prisma.subscriber.count({ where: { isActive: true } }).catch(() => 0),
        getAllCommentsForAdmin().catch(() => []),
        prisma.comment.count().catch(() => 0),
      ]);

      posts = fetchedPosts;
      contactMessages = fetchedMessages;
      comments = fetchedComments;

      let totalPosts = 0;
      let published = 0;
      let drafts = 0;
      let assamese = 0;
      let english = 0;

      for (const row of postStats) {
        const count = row._count.id;
        totalPosts += count;
        if (row.status === "PUBLISHED") published += count;
        if (row.status === "DRAFT") drafts += count;
        if (row.language === "AS") assamese += count;
        if (row.language === "EN") english += count;
      }

      let totalMsgs = 0;
      let unreadMsgs = 0;
      for (const row of messageStats) {
        const count = row._count.id;
        totalMsgs += count;
        if (row.status === "UNREAD") unreadMsgs += count;
      }

      stats = {
        totalPostsCount: totalPosts,
        publishedCount: published,
        draftCount: drafts,
        assameseCount: assamese,
        englishCount: english,
        unreadMessagesCount: unreadMsgs,
        totalMessagesCount: totalMsgs,
        totalVisitors: visitorStats.totalCount,
        todayVisitorGrowth: visitorStats.todayIncrement,
        totalSubscribers: subscriberCount,
        totalCommentsCount: commentCount,
      };
    } catch (err) {
      console.warn("Admin dashboard database error:", err);
      const fallbackVisitors = await getLiveVisitorCount();
      stats.totalVisitors = fallbackVisitors.totalCount;
      stats.todayVisitorGrowth = fallbackVisitors.todayIncrement;
    }
  } else {
    const fallbackVisitors = await getLiveVisitorCount();
    stats.totalVisitors = fallbackVisitors.totalCount;
    stats.todayVisitorGrowth = fallbackVisitors.todayIncrement;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <AdminHeader />

      <main className="flex-1 py-8 sm:py-12">
        <AdminDashboardView
          initialPosts={posts}
          initialMessages={contactMessages}
          initialComments={comments}
          stats={stats}
          initialTab={
            params.tab === "comments"
              ? "comments"
              : params.tab === "messages"
              ? "messages"
              : "posts"
          }
          initialStatus={params.status}
          initialLanguage={params.language}
          initialSearch={params.search}
        />
      </main>
    </div>
  );
}
