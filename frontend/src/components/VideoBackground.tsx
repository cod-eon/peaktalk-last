'use client'

import React from 'react'

interface VideoBackgroundProps {
  opacity?: number
  className?: string
}

export default function VideoBackground({
  opacity = 0.4,
  className = '',
}: VideoBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity"
      >
        <source
          src="/people-chatting-in-messenger-app-team-collaboration-and-remote-work-workplace-decision-and-feedback.mp4"
          type="video/mp4"
        />
      </video>
    </div>
  )
}
