/* Bildmarke „Eclipse": Vollkreis mit diagonalem Schnitt.
   Einfarbig (currentColor), skaliert vom Favicon bis zum Splash. */

import React from "react";

let maskSeq = 0;

export function EclipseMark({ size = 24, className = "", title = "" }) {
  const maskId = React.useMemo(() => `ecl-${++maskSeq}`, []);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <mask id={maskId}>
          <rect width="64" height="64" fill="#fff" />
          <rect
            x="-12"
            y="27.5"
            width="88"
            height="9"
            transform="rotate(-32 32 32)"
            fill="#000"
          />
        </mask>
      </defs>
      <circle cx="32" cy="32" r="27" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

/* Splash / Ladeanimation: Eclipse dreht langsam ein, Wortmarke blendet auf */
export function SplashScreen({ label = "IRONLOG" }) {
  return (
    <div className="ig-splash">
      <div className="ig-splash-mark">
        <EclipseMark size={64} />
      </div>
      <span className="ig-splash-word">{label}</span>
    </div>
  );
}
