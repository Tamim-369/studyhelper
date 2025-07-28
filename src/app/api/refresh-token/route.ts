import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the current session with token
    const sessionWithToken = session as any;
    
    if (!sessionWithToken.refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available. Please sign in again." },
        { status: 401 }
      );
    }

    // Refresh the access token using Google's OAuth2 endpoint
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
      const errorData = await tokenResponse.text();
      console.error('❌ Token refresh failed:', errorData);
      return NextResponse.json(
        { error: "Failed to refresh token. Please sign in again." },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    
    console.log('✅ Token refreshed successfully');

    return NextResponse.json({
      success: true,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });

  } catch (error: any) {
    console.error("❌ Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
