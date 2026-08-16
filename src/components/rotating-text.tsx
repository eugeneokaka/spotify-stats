"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "here's what you've been vibin' to",
  "here's what you've been listening to",
  "your top jams, all ranked",
  "the soundtrack to your life",
  "your repeat-button favorites",
  "what's been on rotation",
];

export function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PHRASES.length);
    }, 2800);

    return () => clearInterval(id);
  }, []);

  return (
    <p
      key={index}
      className="animate-fade-slide bg-gradient-to-r from-purple-400 via-fuchsia-400 to-[#1DB954] bg-clip-text text-2xl font-bold text-transparent sm:text-3xl"
    >
      {PHRASES[index]}
    </p>
  );
}
