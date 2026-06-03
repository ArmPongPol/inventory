"use client";

import { motion } from "framer-motion";
import { useId } from "react";

type SparkProps = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
};

export function Sparkline({
  values,
  width = 200,
  height = 56,
  stroke = "#6157eb",
  fill = "#6157eb",
  className = "",
}: SparkProps) {
  const gid = useId();
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.32" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#${gid})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
      />
      {points.length > 0 && (
        <motion.circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r="3"
          fill={stroke}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.85, type: "spring", stiffness: 300 }}
        />
      )}
    </svg>
  );
}

type BarsProps = {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  colors?: string[];
};

export function Bars({
  values,
  width = 200,
  height = 56,
  className = "",
  colors = ["#10b981"],
}: BarsProps) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const gap = 3;
  const barWidth = Math.max(2, (width - gap * (values.length - 1)) / values.length);

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {values.map((v, i) => {
        const h = Math.max(2, (v / max) * (height - 4));
        const color = colors[i % colors.length];
        return (
          <motion.rect
            key={i}
            x={i * (barWidth + gap)}
            width={barWidth}
            rx="2"
            fill={color}
            initial={{ height: 0, y: height }}
            animate={{ height: h, y: height - h }}
            transition={{
              delay: i * 0.025,
              duration: 0.4,
              ease: [0.2, 0.7, 0.2, 1],
            }}
          />
        );
      })}
    </svg>
  );
}

type DonutProps = {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  thickness?: number;
};

export function Donut({ segments, size = 140, thickness = 18 }: DonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#efeae0"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => {
          const portion = seg.value / total;
          const length = portion * circumference;
          const dasharray = `${length} ${circumference - length}`;
          const dashoffset = -offset;
          offset += length;
          return (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[20px] font-semibold tracking-tight text-ink">
          {total}
        </div>
        <div className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-subtle">
          total
        </div>
      </div>
    </div>
  );
}
