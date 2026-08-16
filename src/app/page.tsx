import { cookies } from "next/headers";
import { SPOTIFY_PROFILE_URL, refreshAccessToken } from "@/lib/spotify";
import type {
  SpotifyArtist,
  SpotifyTrack,
  SpotifyUser,
  TimeRangeKey,
} from "@/lib/types";
import { Dashboard } from "@/components/dashboard";
import { RotatingText } from "@/components/rotating-text";

const TIME_RANGES: TimeRangeKey[] = ["short_term", "medium_term", "long_term"];

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You denied access to the app.",
  missing_params: "Authentication was missing required parameters.",
  token_exchange_failed: "Could not exchange the authorization code for a token.",
  session_expired: "Your session has expired. Please log in again.",
};

export default async function Home(props: PageProps<"/">) {
  const { error } = await props.searchParams;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

  let token = accessToken ?? null;

  if (!token && refreshToken) {
    console.log("[spotify] access token missing, attempting refresh");
    token = (await refreshAccessToken(refreshToken))?.access_token ?? null;
    if (!token) console.error("[spotify] refresh did not yield a token");
  }

  if (!token) {
    console.log(
      `[spotify] no valid token (access=${!!accessToken} refresh=${!!refreshToken})`
    );
    return <Login error={typeof error === "string" ? error : undefined} />;
  }

  let profile = await fetchProfile(token);

  if (!profile && refreshToken) {
    console.log("[spotify] profile fetch failed, retrying after refresh");
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) {
      token = refreshed.access_token;
      profile = await fetchProfile(token);
    }
  }

  if (!profile) {
    console.error("[spotify] profile fetch failed after refresh attempt");
    return <Login error="session_expired" />;
  }

  const [topArtists, topTracks] = await Promise.all([
    fetchTopItems<SpotifyArtist>(token, "artists"),
    fetchTopItems<SpotifyTrack>(token, "tracks"),
  ]);

  return (
    <Profile profile={profile} artists={topArtists} tracks={topTracks} />
  );
}

async function fetchProfile(token: string): Promise<SpotifyUser | null> {
  const res = await fetch(SPOTIFY_PROFILE_URL, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[spotify] profile fetch failed with status ${res.status}: ${body}`
    );
    return null;
  }

  return (await res.json()) as SpotifyUser;
}

async function fetchTopItems<T>(
  token: string,
  type: "artists" | "tracks"
): Promise<Record<TimeRangeKey, T[]>> {
  const results = await Promise.all(
    TIME_RANGES.map(async (range) => {
      const res = await fetch(
        `https://api.spotify.com/v1/me/top/${type}?limit=20&time_range=${range}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(
          `[spotify] top ${type} (${range}) fetch failed with status ${res.status}: ${body}`
        );
        return [];
      }

      const data = await res.json();
      return data.items as T[];
    })
  );

  return {
    short_term: results[0],
    medium_term: results[1],
    long_term: results[2],
  };
}

function Login({ error }: { error?: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-white">
        My Spotify Profile
      </h1>
      <p className="max-w-md text-zinc-400">
        Log in with your Spotify account to see your profile details.
      </p>
      <a
        href="/api/auth/spotify"
        className="rounded-full bg-[#1DB954] px-8 py-3 font-medium text-black transition-colors hover:bg-[#1ed760]"
      >
        Log in with Spotify
      </a>
      {error && (
        <p className="max-w-md text-sm text-red-400">
          {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
        </p>
      )}
    </main>
  );
}

function Profile({
  profile,
  artists,
  tracks,
}: {
  profile: SpotifyUser;
  artists: Record<TimeRangeKey, SpotifyArtist[]>;
  tracks: Record<TimeRangeKey, SpotifyTrack[]>;
}) {
  const firstName = (profile.display_name ?? "there").split(" ")[0];
  const avatar = profile.images?.[0]?.url;

  return (
    <main className="flex flex-1 flex-col items-center gap-10 bg-zinc-950 px-6 py-16">
      <header className="relative flex flex-col items-center gap-3 pt-10 text-center">
        <FloatingNotes />

        {avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={profile.display_name ?? "Profile avatar"}
            width={96}
            height={96}
            className="animate-bounce-soft h-24 w-24 rounded-full border-2 border-[#1DB954]"
          />
        )}

        <h1 className="text-4xl font-bold tracking-tight text-white">
          Hey {firstName}!
        </h1>

        <RotatingText />
        <Equalizer />
      </header>

      <Dashboard artists={artists} tracks={tracks} />

      <a
        href="/api/auth/logout"
        className="mt-2 rounded-full border border-zinc-700 px-6 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
      >
        Log out
      </a>
    </main>
  );
}

function FloatingNotes() {
  const notes = [
    { left: "8%", top: "0", delay: "0s", fontSize: "1.5rem" },
    { left: "20%", top: "2.5rem", delay: "1.2s", fontSize: "1rem" },
    { left: "78%", top: "0.5rem", delay: "0.6s", fontSize: "1.25rem" },
    { left: "90%", top: "2.5rem", delay: "1.8s", fontSize: "0.9rem" },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-24"
    >
      {notes.map((note, i) => (
        <span
          key={i}
          className="music-note absolute text-[#1DB954]"
          style={{
            left: note.left,
            top: note.top,
            animationDelay: note.delay,
            fontSize: note.fontSize,
          }}
        >
          ♪
        </span>
      ))}
    </div>
  );
}

function Equalizer() {
  return (
    <div className="flex h-8 items-end gap-1.5" aria-hidden="true">
      {[0.9, 0.5, 1, 0.7, 0.4, 1, 0.8].map((duration, i) => (
        <span
          key={i}
          className="eq-bar w-1.5 rounded-full bg-[#1DB954]"
          style={{
            height: "100%",
            animationDuration: `${duration}s`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
