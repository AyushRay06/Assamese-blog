"use server";

import prisma from "@/lib/prisma";
import { assertAdminAuthorized } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteSubscriberAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await assertAdminAuthorized();
  } catch {
    return {
      success: false,
      error: "Your admin session expired. Please log in at /admin/login.",
    };
  }

  try {
    const existing = await prisma.subscriber.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Subscriber not found." };
    }

    await prisma.subscriber.delete({
      where: { id },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("deleteSubscriberAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete subscriber.",
    };
  }
}

export async function toggleSubscriberStatusAction(
  id: string
): Promise<{ success: true; isActive: boolean } | { success: false; error: string }> {
  try {
    await assertAdminAuthorized();
  } catch {
    return {
      success: false,
      error: "Your admin session expired. Please log in at /admin/login.",
    };
  }

  try {
    const existing = await prisma.subscriber.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Subscriber not found." };
    }

    const updated = await prisma.subscriber.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
        unsubscribedAt: existing.isActive ? new Date() : null,
      },
    });

    revalidatePath("/admin");
    return { success: true, isActive: updated.isActive };
  } catch (err) {
    console.error("toggleSubscriberStatusAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update subscriber status.",
    };
  }
}
