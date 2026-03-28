import React, { useMemo, useState } from "react";

export default function AppLogo({ className = "", alt = "MAQUETI" }) {
  const fallbackSrc = useMemo(() => "/pwa-192.png", []);
  const [src, setSrc] = useState("/pwa-512.png");

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      decoding="async"
      onError={() => {
        if (src !== fallbackSrc) setSrc(fallbackSrc);
      }}
    />
  );
}
