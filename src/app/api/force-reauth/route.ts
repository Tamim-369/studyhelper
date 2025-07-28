import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has a valid refresh token
    const sessionWithToken = session as any;
    
    if (!sessionWithToken.refreshToken) {
      return NextResponse.json({
        needsReauth: true,
        message: "No refresh token available. Please sign out and sign in again to enable large file uploads.",
      });
    }

    // Test if the refresh token works
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: sessionWithToken.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        return NextResponse.json({
          needsReauth: true,
          message: "Your authentication has expired. Please sign out and sign in again to enable large file uploads.",
        });
      }

      return NextResponse.json({
        needsReauth: false,
        message: "Authentication is valid.",
      });

    } catch (error) {
      return NextResponse.json({
        needsReauth: true,
        message: "Authentication check failed. Please sign out and sign in again.",
      });
    }

  } catch (error: any) {
    console.error("❌ Error checking auth status:", error);
    return NextResponse.json(
      { error: "Failed to check authentication status" },
      { status: 500 }
    );
  }
}
