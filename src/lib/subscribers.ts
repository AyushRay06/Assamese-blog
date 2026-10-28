import prisma from "@/lib/prisma";
import {
  sendNewPostNotificationToSubscribers,
  sendSubscriberWelcomeEmail,
} from "@/lib/email";

/**
 * Normalizes email address (trims whitespace, converts to lowercase)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates email format using standard regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Subscribes an email to the blog updates newsletter.
 * If the email was previously unsubscribed, reactivates their subscription.
 * Sends a welcome confirmation email in the background.
 */
export async function subscribeEmail(
  rawEmail: string,
  name?: string
): Promise<{
  success: boolean;
  isNew: boolean;
  totalSubscribers: number;
  message: string;
}> {
  const email = normalizeEmail(rawEmail);

  if (!isValidEmail(email)) {
    throw new Error("Please provide a valid email address.");
  }

  const existing = await prisma.subscriber.findUnique({
    where: { email },
  });

  let isNew = false;

  if (existing) {
    if (existing.isActive) {
      const total = await prisma.subscriber.count({ where: { isActive: true } });
      return {
        success: true,
        isNew: false,
        totalSubscribers: total,
        message: "You are already subscribed to new blog publications.",
      };
    } else {
      // Reactivate subscription
      await prisma.subscriber.update({
        where: { email },
        data: {
          isActive: true,
          unsubscribedAt: null,
          name: name?.trim() || existing.name,
        },
      });
      isNew = true;
    }
  } else {
    await prisma.subscriber.create({
      data: {
        email,
        name: name?.trim() || null,
        isActive: true,
      },
    });
    isNew = true;
  }

  // Send welcome confirmation email in the background
  sendSubscriberWelcomeEmail({ email, name }).catch((err) => {
    console.warn("[Subscribe Welcome Email] Background send error:", err);
  });

  const totalSubscribers = await prisma.subscriber.count({
    where: { isActive: true },
  });

  return {
    success: true,
    isNew,
    totalSubscribers,
    message: "Thank you for subscribing! You will receive notifications for new essays.",
  };
}

/**
 * Unsubscribes an email from newsletter notifications
 */
export async function unsubscribeEmail(
  rawEmail: string
): Promise<{ success: boolean; message: string }> {
  const email = normalizeEmail(rawEmail);

  if (!isValidEmail(email)) {
    throw new Error("Invalid email address.");
  }

  const existing = await prisma.subscriber.findUnique({
    where: { email },
  });

  if (!existing || !existing.isActive) {
    return {
      success: true,
      message: "You have already been unsubscribed from notifications.",
    };
  }

  await prisma.subscriber.update({
    where: { email },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  });

  return {
    success: true,
    message: "You have been unsubscribed successfully.",
  };
}

/**
 * Gets the total count of active subscribers
 */
export async function getActiveSubscribersCount(): Promise<number> {
  try {
    return await prisma.subscriber.count({
      where: { isActive: true },
    });
  } catch (err) {
    console.warn("[Subscribers Count Error]:", err);
    return 0;
  }
}

/**
 * Dispatches notification emails to all active subscribers when a new blog post is published.
 * Executes non-blockingly so the publish mutation is never delayed or failed.
 */
export async function notifySubscribersOfNewPost(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  language: string;
  readingTime?: number | null;
}): Promise<void> {
  try {
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      console.log("[New Post Notification] No active subscribers to notify.");
      return;
    }

    const recipients = subscribers.map((s) => s.email);
    console.log(
      `[New Post Notification] Notifying ${recipients.length} subscriber(s) for "${post.title}"`
    );

    // Non-blocking background dispatch
    sendNewPostNotificationToSubscribers({
      recipients,
      post,
    })
      .then((res) => {
        console.log(
          `[New Post Notification] Successfully dispatched to ${res.sentCount} subscriber(s).`
        );
      })
      .catch((err) => {
        console.error("[New Post Notification Error]:", err);
      });
  } catch (err) {
    console.error("[Notify Subscribers Database Error]:", err);
  }
}
