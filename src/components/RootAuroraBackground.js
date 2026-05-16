'use client';

import { useEffect, useState } from 'react';

/* Primary terracotta — #E29578 */
const TERRACOTTA = '226, 149, 120';

const TERRACOTTA_BLOBS = [
  `rgba(${TERRACOTTA}, 0.22)`,
  `rgba(${TERRACOTTA}, 0.18)`,
  `rgba(${TERRACOTTA}, 0.15)`,
  `rgba(${TERRACOTTA}, 0.12)`,
  `rgba(${TERRACOTTA}, 0.1)`,
];

const GREEN_BLOBS = ['rgba(67, 151, 117, 0.09)', 'rgba(67, 151, 117, 0.07)'];

const FLOAT_ANIMATIONS = [
  'dashboard-aurora-float-a',
  'dashboard-aurora-float-b',
  'dashboard-aurora-float-c',
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickBlobColor(topPercent) {
  if (topPercent < 32) {
    return pick(TERRACOTTA_BLOBS);
  }
  return Math.random() < 0.82 ? pick(TERRACOTTA_BLOBS) : pick(GREEN_BLOBS);
}

function createRandomBlobs(count = 6) {
  return Array.from({ length: count }, (_, index) => {
    const top = randomBetween(-22, 68);

    return {
      id: index,
      width: `min(${randomBetween(38, 82).toFixed(0)}vw, ${randomBetween(20, 38).toFixed(0)}rem)`,
      height: `min(${randomBetween(28, 62).toFixed(0)}vw, ${randomBetween(14, 30).toFixed(0)}rem)`,
      top: `${top.toFixed(1)}%`,
      left: `${randomBetween(-18, 78).toFixed(1)}%`,
      background: pickBlobColor(top),
      animation: `${pick(FLOAT_ANIMATIONS)} ${randomBetween(24, 38).toFixed(1)}s ease-in-out infinite`,
      animationDelay: `${randomBetween(0, 12).toFixed(1)}s`,
    };
  });
}

function createRandomWash() {
  const g1x = randomBetween(4, 28).toFixed(0);
  const g1y = randomBetween(2, 22).toFixed(0);
  const g2x = randomBetween(72, 98).toFixed(0);
  const g2y = randomBetween(4, 26).toFixed(0);
  const g3x = randomBetween(35, 75).toFixed(0);
  const g3y = randomBetween(55, 95).toFixed(0);
  const g4x = randomBetween(18, 55).toFixed(0);
  const g4y = randomBetween(35, 70).toFixed(0);
  const g5x = randomBetween(45, 85).toFixed(0);
  const g5y = randomBetween(8, 40).toFixed(0);

  return `
    radial-gradient(56rem 34rem at ${g1x}% ${g1y}%, rgba(${TERRACOTTA}, 0.15), transparent 62%),
    radial-gradient(50rem 30rem at ${g2x}% ${g2y}%, rgba(${TERRACOTTA}, 0.12), transparent 64%),
    radial-gradient(46rem 28rem at ${g5x}% ${g5y}%, rgba(${TERRACOTTA}, 0.1), transparent 66%),
    radial-gradient(40rem 24rem at ${g4x}% ${g4y}%, rgba(${TERRACOTTA}, 0.08), transparent 68%),
    radial-gradient(42rem 26rem at ${g3x}% ${g3y}%, rgba(67, 151, 117, 0.06), transparent 70%),
    #ffffff
  `;
}

export default function RootAuroraBackground() {
  const [aurora, setAurora] = useState(null);

  useEffect(() => {
    setAurora({
      wash: createRandomWash(),
      blobs: createRandomBlobs(),
    });
  }, []);

  return (
    <div
      className="root-aurora-bg"
      aria-hidden="true"
      style={aurora ? { background: aurora.wash } : undefined}
    >
      {aurora?.blobs.map((blob) => (
        <span
          key={blob.id}
          className="root-aurora-blob"
          style={{
            width: blob.width,
            height: blob.height,
            top: blob.top,
            left: blob.left,
            background: blob.background,
            animation: blob.animation,
            animationDelay: blob.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
