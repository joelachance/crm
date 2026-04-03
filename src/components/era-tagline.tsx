"use client";

import { useEffect, useState } from "react";

const taglines = [
  "monitoring the situation",
  "no more ghosting",
  "lets yeet some customers",
  "bruh"
];

function pickRandomTagline() {
  return taglines[Math.floor(Math.random() * taglines.length)] ?? taglines[0];
}

export function EraTagline() {
  const [tagline, setTagline] = useState(taglines[0]);

  useEffect(() => {
    setTagline(pickRandomTagline());
  }, []);

  return <p className="text-sm text-white/65">{tagline}</p>;
}
