"use client";

import Image from "next/image";
import { useState } from "react";

export function CoinAvatar({ coin }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = coin.imageUrl && coin.imageUrl !== failedUrl;

  return (
    <div className={`coin-avatar ${showImage ? "coin-avatar--image" : "avatar--blue"}`} aria-hidden="true">
      {showImage ? (
        <Image
          src={coin.imageUrl}
          alt=""
          width={69}
          height={69}
          unoptimized
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(coin.imageUrl)}
          className="coin-avatar-image"
        />
      ) : coin.symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}
