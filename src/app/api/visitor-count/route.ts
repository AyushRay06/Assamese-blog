import { NextResponse } from "next/server";
import { getLiveVisitorCount, recordVisitorHit } from "@/lib/visitor-count";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getLiveVisitorCount();
    return NextResponse.json({
      success: true,
      count: stats.totalCount,
      todayIncrement: stats.todayIncrement,
      date: stats.todayDateStr,
    });
  } catch (err) {
    console.error("[API visitor-count GET error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve visitor count" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const updatedCount = await recordVisitorHit();
    return NextResponse.json({
      success: true,
      count: updatedCount,
    });
  } catch (err) {
    console.error("[API visitor-count POST error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to record visitor count" },
      { status: 500 }
    );
  }
}
