"use client";

import Image from "next/image";

interface Props {
  src: string;
  opacity?: number;
  gradient?: "dark" | "red" | "green";
}

const gradients = {
  dark:  "from-black/85 via-black/65 to-black/90",
  red:   "from-black/85 via-red-950/40 to-black/90",
  green: "from-black/85 via-emerald-950/30 to-black/90",
};

export function RacingImageBackground({ src, opacity = 0.2, gradient = "dark" }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover object-center"
        style={{ opacity }}
        priority
        quality={55}
        unoptimized={false}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${gradients[gradient]}`} />
    </div>
  );
}
