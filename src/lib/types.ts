export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type SpotifyUser = {
  display_name: string | null;
  email: string;
  id: string;
  uri: string;
  href: string;
  country: string;
  product: string;
  external_urls: { spotify: string };
  followers: { href: string | null; total: number };
  images: SpotifyImage[];
};

export type SpotifyArtist = {
  id: string;
  name: string;
  href: string;
  external_urls: { spotify: string };
  genres: string[];
  popularity: number;
  images: SpotifyImage[];
};

export type SpotifyTrack = {
  id: string;
  name: string;
  href: string;
  external_urls: { spotify: string };
  popularity: number;
  duration_ms: number;
  album: { name: string; images: SpotifyImage[] };
  artists: { id: string; name: string }[];
};

export type TimeRangeKey = "short_term" | "medium_term" | "long_term";

export type PlayableTrack = {
  id: string;
  name: string;
  artistName: string;
  imageUrl: string | null;
};
