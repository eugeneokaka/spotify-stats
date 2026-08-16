import { NextRequest, NextResponse } from "next/server";
import { SPOTIFY_TOKEN_URL, getOrigin, getRedirectUri } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = getRedirectUri(request);
  const origin = getOrigin(request);

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const verifier = request.cookies.get("spotify_code_verifier")?.value;

  if (error) {
    console.error(`[spotify] authorization error returned: ${error}`);
    return NextResponse.redirect(new URL(`/?error=${error}`, origin));
  }

  if (!code || !verifier || !clientId) {
    console.error(
      `[spotify] callback missing params (code=${!!code} verifier=${!!verifier} clientId=${!!clientId})`
    );
    return NextResponse.redirect(new URL("/?error=missing_params", origin));
  }

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const result = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await result.json();

  if (!result.ok || !data.access_token) {
    const body = JSON.stringify(data);
    console.error(
      `[spotify] token exchange failed with status ${result.status}: ${body}`
    );
    return NextResponse.redirect(
      new URL("/?error=token_exchange_failed", origin)
    );
  }

  console.log("[spotify] token exchange successful, saving session");

  const response = NextResponse.redirect(new URL("/", origin));

  response.cookies.set("spotify_access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: data.expires_in ?? 3600,
    path: "/",
  });

  if (data.refresh_token) {
    response.cookies.set("spotify_refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  response.cookies.delete("spotify_code_verifier");

  return response;
}
