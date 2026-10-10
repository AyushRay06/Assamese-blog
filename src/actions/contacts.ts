"use server";

import prisma from "@/lib/prisma";
import { assertAdminAuthorized } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteContactMessageAction(
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
    const existing = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Contact message not found." };
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("deleteContactMessageAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete message.",
    };
  }
}

export async function deleteAllContactMessagesAction(): Promise<
  { success: true; count: number } | { success: false; error: string }
> {
  try {
    await assertAdminAuthorized();
  } catch {
    return {
      success: false,
      error: "Your admin session expired. Please log in at /admin/login.",
    };
  }

  try {
    const result = await prisma.contactMessage.deleteMany({});
    revalidatePath("/admin");
    return { success: true, count: result.count };
  } catch (err) {
    console.error("deleteAllContactMessagesAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete messages.",
    };
  }
}

export async function toggleContactMessageStatusAction(
  id: string
): Promise<{ success: true; status: string } | { success: false; error: string }> {
  try {
    await assertAdminAuthorized();
  } catch {
    return {
      success: false,
      error: "Your admin session expired. Please log in at /admin/login.",
    };
  }

  try {
    const existing = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Contact message not found." };
    }

    const nextStatus = existing.status === "UNREAD" ? "READ" : "UNREAD";

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status: nextStatus },
    });

    revalidatePath("/admin");
    return { success: true, status: updated.status };
  } catch (err) {
    console.error("toggleContactMessageStatusAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update message status.",
    };
  }
}
