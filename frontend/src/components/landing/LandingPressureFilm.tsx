'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';

export default function LandingPressureFilm(): React.JSX.Element {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || !wrapperRef.current) return;

    const media = window.matchMedia('(min-width: 768px)');
    const wrapper = wrapperRef.current;
    let isNearViewport = false;

    const sync = () => setShowVideo(isNearViewport && media.matches);
    const observer = new IntersectionObserver(
      ([entry]) => {
        isNearViewport = entry.isIntersecting;
        sync();
      },
      { rootMargin: '240px 0px', threshold: 0.01 },
    );

    observer.observe(wrapper);
    media.addEventListener('change', sync);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', sync);
    };
  }, [prefersReducedMotion]);

  return (
    <div ref={wrapperRef} className="relative aspect-[9/16] overflow-hidden bg-[#FAF8F4]">
      <Image
        src="/noprecache/landing/decision-defense-poster.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 420px, (min-width: 768px) 38vw, 100vw"
        className="object-cover"
        aria-hidden="true"
      />
      {showVideo && !prefersReducedMotion ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/noprecache/landing/decision-defense-poster.png"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setShowVideo(false)}
        >
          <source src="/noprecache/landing/decision-defense-loop.mp4" type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
