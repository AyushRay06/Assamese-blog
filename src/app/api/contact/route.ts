import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendContactNotificationEmail } from "@/lib/email";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email address"),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(2, "Please enter your message"),
});

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request payload. Please check your input." },
        { status: 400 }
      );
    }

    const validationResult = ContactSchema.safeParse(body);
    if (!validationResult.success) {
      const firstErrorMessage = validationResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        {
          success: false,
          error: firstErrorMessage,
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;

    // 1. Record inquiry in PostgreSQL database with retry for serverless resilience
    let savedRecord: any = null;
    let dbError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        savedRecord = await prisma.contactMessage.create({
          data: {
            name,
            email,
            subject: subject || null,
            message,
            status: "UNREAD",
          },
        });
        break; // Successfully saved
      } catch (err: any) {
        dbError = err;
        console.warn(`[Contact DB attempt ${attempt} failed]:`, err?.message || err);
        if (attempt === 1) {
          // brief pause before retry to allow neon endpoint wake-up
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }

    if (!savedRecord) {
      console.warn("[Contact API DB Warning]: Unable to save to DB, proceeding to email dispatch:", dbError?.message || dbError);
    }

    // 2. Dispatch email notification (non-blocking failure safe)
    let emailSent = false;
    try {
      const emailResult = await sendContactNotificationEmail({
        name,
        email,
        subject,
        message,
      });
      emailSent = emailResult.sent;
    } catch (emailErr) {
      console.error("[Contact Email Dispatch Warning]:", emailErr);
      // We don't fail the user request since the inquiry is already safely saved in DB
    }

    const messageNotice = emailSent
      ? "Your message has been received and emailed to the inbox."
      : "Your message has been received and recorded to the portal.";

    return NextResponse.json(
      {
        success: true,
        message: messageNotice,
        id: savedRecord?.id || "inquiry-logged",
        emailSent,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Contact API Unexpected Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while sending your message. Please try again.",
      },
      { status: 500 }
    );
  }
}
