"use client";

import { useState } from "react";
import type {
  PlayableTrack,
  SpotifyArtist,
  SpotifyTrack,
  TimeRangeKey,
} from "@/lib/types";

const RANGES: { key: TimeRangeKey; label: string }[] = [
  { key: "short_term", label: "4 weeks" },
  { key: "medium_term", label: "6 months" },
  { key: "long_term", label: "all time" },
];

const VISIBLE_COUNT = 5;
const EXPAND_STEPS = [10, 20];

function nextVisibleCount(current: number, total: number): number {
  for (const step of EXPAND_STEPS) {
    if (step > current && step <= total) return step;
  }
  return total;
}

function RangeTabs({
  value,
  onChange,
}: {
  value: TimeRangeKey;
  onChange: (value: TimeRangeKey) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full bg-zinc-900 p-1">
      {RANGES.map((range) => {
        const active = range.key === value;
        return (
          <button
            key={range.key}
            type="button"
            onClick={() => onChange(range.key)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#1DB954] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}

function ShowMoreButton({
  visibleCount,
  total,
  onShowMore,
  onShowLess,
}: {
  visibleCount: number;
  total: number;
  onShowMore: () => void;
  onShowLess: () => void;
}) {
  const expanded = visibleCount >= total;
  const increment = nextVisibleCount(visibleCount, total) - visibleCount;

  return (
    <div className="mt-5 flex justify-center">
      <button
        type="button"
        onClick={expanded ? onShowLess : onShowMore}
        className="cursor-pointer rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-[#1DB954] hover:text-[#1DB954]"
      >
        {expanded ? "Show less" : `Show more (${increment})`}
      </button>
    </div>
  );
}

export function TopArtists({
  artists,
}: {
  artists: Record<TimeRangeKey, SpotifyArtist[]>;
}) {
  const [range, setRange] = useState<TimeRangeKey>("short_term");
  const [visibleCount, setVisibleCount] = useState(VISIBLE_COUNT);

  const list = artists[range];
  const visible = list.slice(0, visibleCount);

  return (
    <section className="w-full">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">Top artists</h2>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-zinc-600">No data yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((artist, i) => (
            <a
              key={artist.id}
              href={artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="card-pop group relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl bg-zinc-900 p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:bg-zinc-800 hover:shadow-lg hover:shadow-[#1DB954]/10"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="absolute left-2 top-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">
                #{i + 1}
              </span>
              {artist.images?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artist.images[0].url}
                  alt={artist.name}
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-zinc-800" />
              )}
              <span className="line-clamp-1 text-sm font-medium text-white group-hover:text-[#1DB954]">
                {artist.name}
              </span>
              {artist.genres?.length > 0 && (
                <span className="line-clamp-1 text-xs text-zinc-500">
                  {artist.genres.slice(0, 2).join(", ")}
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      {list.length > VISIBLE_COUNT && (
        <ShowMoreButton
          visibleCount={visibleCount}
          total={list.length}
          onShowMore={() => setVisibleCount(nextVisibleCount(visibleCount, list.length))}
          onShowLess={() => setVisibleCount(VISIBLE_COUNT)}
        />
      )}
    </section>
  );
}

export function TopTracks({
  tracks,
  onPlay,
}: {
  tracks: Record<TimeRangeKey, SpotifyTrack[]>;
  onPlay: (track: PlayableTrack) => void;
}) {
  const [range, setRange] = useState<TimeRangeKey>("short_term");
  const [visibleCount, setVisibleCount] = useState(VISIBLE_COUNT);

  const list = tracks[range];
  const visible = list.slice(0, visibleCount);

  return (
    <section className="w-full">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">Top tracks</h2>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-zinc-600">No data yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((track, i) => (
            <button
              key={track.id}
              type="button"
              onClick={() =>
                onPlay({
                  id: track.id,
                  name: track.name,
                  artistName: track.artists.map((a) => a.name).join(", "),
                  imageUrl: track.album?.images?.[0]?.url ?? null,
                })
              }
              className="card-pop group relative flex cursor-pointer flex-col gap-2 rounded-2xl bg-zinc-900 p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:bg-zinc-800 hover:shadow-lg hover:shadow-[#1DB954]/10"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="absolute left-2 top-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">
                #{i + 1}
              </span>
              <div className="relative">
                {track.album?.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    width={160}
                    height={160}
                    className="aspect-square w-full rounded-xl object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="aspect-square w-full rounded-xl bg-zinc-800" />
                )}
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1DB954] pl-0.5 text-lg text-black">
                    ▶
                  </span>
                </span>
              </div>
              <span className="line-clamp-2 text-sm font-medium text-white group-hover:text-[#1DB954]">
                {track.name}
              </span>
              <span className="line-clamp-1 text-xs text-zinc-500">
                {track.artists.map((a) => a.name).join(", ")}
              </span>
            </button>
          ))}
        </div>
      )}

      {list.length > VISIBLE_COUNT && (
        <ShowMoreButton
          visibleCount={visibleCount}
          total={list.length}
          onShowMore={() => setVisibleCount(nextVisibleCount(visibleCount, list.length))}
          onShowLess={() => setVisibleCount(VISIBLE_COUNT)}
        />
      )}
    </section>
  );
}
