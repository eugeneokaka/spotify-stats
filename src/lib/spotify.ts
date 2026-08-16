export const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_PROFILE_URL = "https://api.spotify.com/v1/me";

export type RefreshedToken = {
  access_token: string;
  expires_in: number;
};

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshedToken | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId) {
    console.error("[spotify] refresh failed: SPOTIFY_CLIENT_ID is not set");
    return null;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[spotify] token refresh failed with status ${res.status}: ${body}`
    );
    return null;
  }

  const data = await res.json();

  if (!data.access_token) {
    console.error("[spotify] token refresh response missing access_token");
    return null;
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in ?? 3600,
  };
}

export function getOrigin(request: Request): string {
  const host = request.headers.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const protocol =
    host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";

  return `${protocol}://${host}`;
}

export function getRedirectUri(request: Request): string {
  const configured = process.env.SPOTIFY_REDIRECT_URI;
  const host = request.headers.get("host");

  if (!host) {
    return configured ?? "http://localhost:3000/api/auth/spotify/callback";
  }

  return `${getOrigin(request)}/api/auth/spotify/callback`;
}
