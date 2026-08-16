"use client";

import { useState } from "react";
import type {
  PlayableTrack,
  SpotifyArtist,
  SpotifyTrack,
  TimeRangeKey,
} from "@/lib/types";
import { TopArtists, TopTracks } from "@/components/top-items";
import { SpotifyPlayer } from "@/components/spotify-player";

export function Dashboard({
  artists,
  tracks,
}: {
  artists: Record<TimeRangeKey, SpotifyArtist[]>;
  tracks: Record<TimeRangeKey, SpotifyTrack[]>;
}) {
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);

  return (
    <>
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <TopArtists artists={artists} />
        <TopTracks tracks={tracks} onPlay={setCurrentTrack} />
      </div>

      <SpotifyPlayer
        track={currentTrack}
        onClose={() => setCurrentTrack(null)}
      />
    </>
  );
}
