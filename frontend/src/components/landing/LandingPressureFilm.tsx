'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';

export default function LandingPressureFilm(): React.JSX.Element {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [hasApproached, setHasApproached] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  const [hasMeaningfulFrame, setHasMeaningfulFrame] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || !wrapperRef.current) return;

    const media = window.matchMedia('(min-width: 768px)');
    const wrapper = wrapperRef.current;
    const syncMedia = () => setIsDesktop(media.matches);
    const approachObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasApproached(true);
        approachObserver.disconnect();
      },
      { rootMargin: '240px 0px', threshold: 0.01 },
    );

    approachObserver.observe(wrapper);
    media.addEventListener('change', syncMedia);

    return () => {
      approachObserver.disconnect();
      media.removeEventListener('change', syncMedia);
    };
  }, [prefersReducedMotion]);

  const shouldMountVideo = hasApproached && isDesktop && !prefersReducedMotion && !playbackFailed;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!shouldMountVideo || !wrapper || !video) return;

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.01 },
    );

    visibilityObserver.observe(wrapper);

    return () => {
      visibilityObserver.disconnect();
      video.pause();
    };
  }, [shouldMountVideo]);

  return (
    <div ref={wrapperRef} data-pressure-film className="relative aspect-[9/16] overflow-hidden bg-[#FAF8F4]">
      <Image
        src="/noprecache/landing/decision-defense-poster.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 420px, (min-width: 768px) 38vw, 100vw"
        className="object-cover"
        aria-hidden="true"
      />
      {shouldMountVideo ? (
        <video
          ref={videoRef}
          data-pressure-video
          data-meaningful-frame={hasMeaningfulFrame ? 'true' : 'false'}
          muted
          loop
          playsInline
          preload="none"
          poster="/noprecache/landing/decision-defense-poster.png"
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hasMeaningfulFrame ? 'opacity-100' : 'opacity-0'}`}
          onTimeUpdate={(event) => {
            if (event.currentTarget.currentTime >= 10.5) setHasMeaningfulFrame(true);
          }}
          onError={() => setPlaybackFailed(true)}
        >
          <source src="/noprecache/landing/decision-defense-loop.mp4" type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
