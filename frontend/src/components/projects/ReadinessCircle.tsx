
import React from 'react';
import { motion } from 'framer-motion';

interface ReadinessCircleProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
}

export const ReadinessCircle: React.FC<ReadinessCircleProps> = ({ 
  score, 
  size = 60, 
  strokeWidth = 4 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeScore = score !== null ? Math.min(Math.max(score, 0), 1) : 0;
  const offset = circumference - safeScore * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/5"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          className={
            safeScore >= 0.8 ? 'text-emerald-400' : 
            safeScore >= 0.5 ? 'text-[var(--accent-blue)]' : 
            'text-amber-400'
          }
        />
      </svg>
      {score === null ? (
        <span className="absolute text-[10px] font-mono text-[var(--text-dim)]">N/A</span>
      ) : (
        <span className="absolute text-xs font-bold font-mono">
          {Math.round(safeScore * 100)}%
        </span>
      )}
    </div>
  );
};
