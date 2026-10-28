import { NextRequest, NextResponse } from "next/server";
import { unsubscribeEmail } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Unsubscribe</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #fafafa; color: #18181b;">
          <div style="background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; max-width: 420px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="margin: 0 0 12px 0; font-size: 20px;">Invalid Request</h2>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 20px 0;">No email address was provided in the unsubscribe link.</p>
            <a href="/" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Return to Home</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    await unsubscribeEmail(email);

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Unsubscribed Successfully</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #fafafa; color: #18181b;">
          <div style="background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #ecfdf5; color: #10b981; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 24px;">✓</div>
            <h2 style="margin: 0 0 8px 0; font-size: 20px;">Unsubscribed</h2>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 24px 0;"><strong>${email}</strong> has been removed from blog notification emails.</p>
            <a href="/" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Return to Home</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to unsubscribe";
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Unsubscribe Error</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #fafafa; color: #18181b;">
          <div style="background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; max-width: 420px; text-align: center;">
            <h2 style="margin: 0 0 12px 0; font-size: 20px;">Error</h2>
            <p style="color: #ef4444; font-size: 14px; margin: 0 0 20px 0;">${errorMsg}</p>
            <a href="/" style="display: inline-block; background: #18181b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Return to Home</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
