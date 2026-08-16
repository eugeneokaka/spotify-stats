export const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_PROFILE_URL = "https://api.spotify.com/v1/me";

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
