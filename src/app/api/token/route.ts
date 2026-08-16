import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/spotify";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

  if (accessToken) {
    return NextResponse.json({ access_token: accessToken });
  }

  if (refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);

    if (refreshed) {
      const response = NextResponse.json({
        access_token: refreshed.access_token,
      });

      response.cookies.set("spotify_access_token", refreshed.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: refreshed.expires_in,
        path: "/",
      });

      return response;
    }

    console.error("[spotify] /api/token refresh failed");
  }

  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
