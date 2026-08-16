"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayableTrack } from "@/lib/types";

type SpotifyPlayerInstance = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  pause: () => Promise<void>;
  togglePlay: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  addListener: (event: string, cb: (data: unknown) => void) => boolean;
};

type SpotifyPlayerConfig = {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
};

declare global {
  interface Window {
    Spotify?: {
      Player: new (config: SpotifyPlayerConfig) => SpotifyPlayerInstance;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

type ReadyData = { device_id: string };
type PlayerStateData = { paused: boolean };

export function SpotifyPlayer({
  track,
  onClose,
}: {
  track: PlayableTrack | null;
  onClose: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pendingTrackRef = useRef<PlayableTrack | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/token")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        tokenRef.current = data.access_token ?? null;
        initPlayer();
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (document.getElementById("spotify-player-sdk")) return;

    const script = document.createElement("script");
    script.id = "spotify-player-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    window.onSpotifyWebPlaybackSDKReady = initPlayer;
    document.body.appendChild(script);

    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
      deviceIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initPlayer() {
    const Spotify = window.Spotify;
    if (playerRef.current || !Spotify || !tokenRef.current) return;

    const player = new Spotify.Player({
      name: "My Spotify Profile",
      getOAuthToken: (cb) => {
        fetch("/api/token")
          .then((res) => res.json())
          .then((data) => cb(data.access_token));
      },
      volume: 0.5,
    });

    player.addListener("ready", (data) => {
      const { device_id } = data as ReadyData;
      deviceIdRef.current = device_id;
      setSdkFailed(false);

      if (pendingTrackRef.current) {
        const pending = pendingTrackRef.current;
        pendingTrackRef.current = null;
        playOnDevice(pending);
      }
    });

    player.addListener("not_ready", () => {
      deviceIdRef.current = null;
    });

    player.addListener("player_state_changed", (data) => {
      const state = data as PlayerStateData | null;
      if (state) setIsPlaying(!state.paused);
    });

    player.addListener("account_error", () => {
      setSdkFailed(true);
    });

    player.addListener("authentication_error", () => {
      setSdkFailed(true);
    });

    player.addListener("initialization_error", () => {
      setSdkFailed(true);
    });

    player.connect();
    playerRef.current = player;
  }

  async function playOnDevice(item: PlayableTrack) {
    const deviceId = deviceIdRef.current;
    const token = tokenRef.current;

    if (!deviceId || !token) {
      pendingTrackRef.current = item;
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      // Make this SDK device the active playback device first.
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers,
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
      });

      const res = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ uris: [`spotify:track:${item.id}`] }),
        }
      );

      if (!res.ok) {
        if (res.status === 404) {
          deviceIdRef.current = null;
          pendingTrackRef.current = item;
        }
        setError("Could not start playback.");
      }
    } catch {
      setError("Could not start playback.");
    }
  }

  useEffect(() => {
    if (sdkFailed) return;

    if (track) {
      playOnDevice(track);
    } else {
      playerRef.current?.pause().catch(() => {});
    }
  }, [track, sdkFailed]);

  function handleVolume(value: number) {
    setVolume(value);
    playerRef.current?.setVolume(value);
  }

  function togglePlay() {
    playerRef.current?.togglePlay().catch(() => {});
  }

  if (!track) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-zinc-900 p-3 shadow-2xl shadow-black/60">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close player"
          className="absolute -right-2 -top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#1DB954] text-sm font-bold text-black transition-colors hover:bg-[#1ed760]"
        >
          ✕
        </button>

        {sdkFailed ? (
          <iframe
            src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={track.name}
            className="rounded-xl"
          />
        ) : (
          <div className="flex items-center gap-3">
            {track.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.imageUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-zinc-800" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {track.name}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {track.artistName}
              </p>
              {error && (
                <p className="mt-0.5 truncate text-xs text-red-400">{error}</p>
              )}
            </div>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#1DB954] text-black transition-colors hover:bg-[#1ed760]"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-zinc-500">
                <VolumeIcon />
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => handleVolume(Number(e.target.value))}
                aria-label="Volume"
                className="h-1 w-20 cursor-pointer accent-[#1DB954]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
