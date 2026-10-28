import { NextResponse } from "next/server";
import { subscribeEmail, getActiveSubscribersCount } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await getActiveSubscribersCount();
    return NextResponse.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error("[API subscribe GET error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve subscriber count" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const result = await subscribeEmail(email, name);

    return NextResponse.json({
      success: true,
      message: result.message,
      isNew: result.isNew,
      count: result.totalSubscribers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to subscribe.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
