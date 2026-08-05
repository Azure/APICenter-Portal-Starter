import React, { useEffect, useRef } from 'react';

/**
 * PROTOTYPE — animated dot-grid backdrop.
 *
 * Ported from the CoreAI design-system "dot-grid" canvas study (Olivia / James).
 * A field of grid dots is lit up by invisible flowing "squiggle" blobs plus a
 * per-dot twinkle, producing a soft animated wave through the dots. Adapted to:
 *  - size to its parent banner (not the window),
 *  - take its dot color + opacity from the Banner Lab controls,
 *  - scale for devicePixelRatio, and
 *  - honor prefers-reduced-motion (renders a single static frame).
 *
 * The canvas is transparent, so the banner gradient/solid layer shows through.
 */

interface DotGridCanvasProps {
  /** Dot color (hex, e.g. #a78bfa). */
  color: string;
  /** Overall layer opacity 0..1. */
  opacity?: number;
  className?: string;
}

const config = {
  dotSize: 2.1,
  gridSpacing: 18,
  animationSpeed: 0.0225,
  maxOpacity: 0.8,
  minOpacity: 0.055,
  numSquiggles: 96,
  squiggleLength: 25,
  squiggleWidth: 60,
  pulseSpeed: 0.75,
  pulseAmount: 0.5,
  twinkleAmount: 0.2,
  twinkleSpeed: 0.01,
  twinkleScale: 0.025,
};

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export const DotGridCanvas: React.FC<DotGridCanvasProps> = ({ color, opacity = 1, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);
  const opacityRef = useRef(opacity);
  colorRef.current = color;
  opacityRef.current = opacity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cellSize = config.squiggleWidth * 2;
    const numSamples = 20;

    let W = 0;
    let H = 0;
    let time = 0;
    let lastTime = 0;
    let rafId = 0;

    interface Squiggle {
      baseX: number; baseY: number; orbitRadius: number; orbitSpeedX: number; orbitSpeedY: number;
      rotationSpeed: number; frequency: number; frequency2: number; amplitude: number; amplitude2: number;
      phase: number; phase2: number; morphSpeed: number; morphPhase: number; morphSpeed2: number;
      morphPhase2: number; morphSpeed3: number; morphPhase3: number; length: number;
      opacityMultiplier: number; fadePhase: number; fadeCycleDuration: number;
    }
    interface Dot { x: number; y: number; seed: number; opacity: number }
    interface SamplePt { x: number; y: number; influenceMultiplier: number; width: number }

    let dots: Dot[] = [];
    let squiggles: Squiggle[] = [];
    const spatialHash = new Map<string, SamplePt[]>();

    const hashKey = (x: number, y: number) => `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;

    function initSquiggles() {
      squiggles = [];
      const cols = Math.ceil(Math.sqrt(config.numSquiggles * (W / Math.max(1, H))));
      const rows = Math.ceil(config.numSquiggles / cols);
      const cellWidth = W / cols;
      const cellHeight = H / rows;
      for (let i = 0; i < config.numSquiggles; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const centerX = (col + 0.5) * cellWidth;
        const centerY = (row + 0.5) * cellHeight;
        const offsetX = (Math.random() - 0.5) * cellWidth * 0.6;
        const offsetY = (Math.random() - 0.5) * cellHeight * 0.6;
        squiggles.push({
          baseX: centerX + offsetX,
          baseY: centerY + offsetY,
          orbitRadius: 2 + Math.random() * 20,
          orbitSpeedX: 0.02 + Math.random() * 0.2,
          orbitSpeedY: 0.02 + Math.random() * 0.25,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          frequency: 0.01 + Math.random() * 0.08,
          frequency2: 0.02 + Math.random() * 0.12,
          amplitude: 5 + Math.random() * 50,
          amplitude2: 3 + Math.random() * 35,
          phase: Math.random() * Math.PI * 2,
          phase2: Math.random() * Math.PI * 2,
          morphSpeed: 0.1 + Math.random() * 0.8,
          morphPhase: Math.random() * Math.PI * 2,
          morphSpeed2: 0.1 + Math.random() * 0.8,
          morphPhase2: Math.random() * Math.PI * 2,
          morphSpeed3: 0.1 + Math.random() * 0.8,
          morphPhase3: Math.random() * Math.PI * 2,
          length: config.squiggleLength * (0.3 + Math.random() * 0.8),
          opacityMultiplier: 0.3 + Math.random() * 0.7,
          fadePhase: Math.random() * Math.PI * 2,
          fadeCycleDuration: 10 + Math.random() * 8,
        });
      }
    }

    function initializeDots() {
      dots = [];
      const cols = Math.ceil(W / config.gridSpacing);
      const rows = Math.ceil(H / config.gridSpacing);
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          dots.push({ x: i * config.gridSpacing, y: j * config.gridSpacing, seed: Math.random() * 1000, opacity: config.minOpacity });
        }
      }
    }

    function buildSpatialHash() {
      spatialHash.clear();
      for (let si = 0; si < squiggles.length; si++) {
        const s = squiggles[si];
        const fadeFrequency = (2 * Math.PI) / (s.fadeCycleDuration / config.animationSpeed / 10);
        const fadePulse = Math.sin(time * fadeFrequency + s.fadePhase);
        const lifetimeAlpha = 0.3 + (fadePulse + 1) * 0.35;
        const pulseValue = Math.sin(time * config.pulseSpeed + s.phase) * config.pulseAmount;
        const squigglePulse = 1 + pulseValue;
        const orbitX = Math.sin(time * s.orbitSpeedX + s.phase) * s.orbitRadius;
        const orbitY = Math.cos(time * s.orbitSpeedY + s.phase2) * s.orbitRadius;
        const wrapX = (((s.baseX + orbitX) % W) + W) % W;
        const wrapY = (((s.baseY + orbitY) % H) + H) % H;
        const angle = time * s.rotationSpeed;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const morphFactor = Math.sin(time * s.morphSpeed + s.morphPhase) * 0.5 + 0.5;
        const morphFactor2 = Math.sin(time * s.morphSpeed2 + s.morphPhase2) * 0.5 + 0.5;
        const morphFactor3 = Math.sin(time * s.morphSpeed3 + s.morphPhase3) * 0.5 + 0.5;
        const morphedAmp1 = s.amplitude * (0.4 + morphFactor * 0.9);
        const morphedAmp2 = s.amplitude2 * (0.4 + morphFactor * 0.9);
        const morphedLength = s.length * (0.5 + morphFactor2 * 0.8);
        const morphedWidth = config.squiggleWidth * (0.7 + morphFactor3 * 0.6);
        const influenceMultiplier = squigglePulse * s.opacityMultiplier * lifetimeAlpha;
        for (let i = 0; i < numSamples; i++) {
          const t = (i / numSamples) * morphedLength;
          const wave1 = Math.sin(t * s.frequency + time + s.phase) * morphedAmp1;
          const wave2 = Math.sin(t * s.frequency2 + time * 0.7 + s.phase2) * morphedAmp2;
          const combinedWave = wave1 + wave2;
          const pathX = wrapX + t * cosAngle + combinedWave * sinAngle;
          const pathY = wrapY + t * sinAngle + combinedWave * cosAngle;
          const key = hashKey(pathX, pathY);
          let bucket = spatialHash.get(key);
          if (!bucket) { bucket = []; spatialHash.set(key, bucket); }
          bucket.push({ x: pathX, y: pathY, influenceMultiplier, width: morphedWidth });
        }
      }
    }

    function getNearbyPoints(x: number, y: number): SamplePt[] {
      const cx = Math.floor(x / cellSize);
      const cy = Math.floor(y / cellSize);
      const nearby: SamplePt[] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const points = spatialHash.get(`${cx + dx},${cy + dy}`);
          if (points) for (let i = 0; i < points.length; i++) nearby.push(points[i]);
        }
      }
      return nearby;
    }

    function drawFrame() {
      ctx!.clearRect(0, 0, W, H);
      buildSpatialHash();
      const opacityRange = config.maxOpacity - config.minOpacity;
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        let maxInfluence = 0;
        const nearby = getNearbyPoints(dot.x, dot.y);
        for (let j = 0; j < nearby.length; j++) {
          const point = nearby[j];
          const dx = dot.x - point.x;
          const dy = dot.y - point.y;
          const distSq = dx * dx + dy * dy;
          const pointWidthSq = point.width * point.width;
          if (distSq < pointWidthSq) {
            const normalizedDist = Math.sqrt(distSq) / point.width;
            const smoothed = 1 - normalizedDist;
            const gradient = smoothed * smoothed * (3 - 2 * smoothed);
            const influence = gradient * gradient * gradient * point.influenceMultiplier;
            if (influence > maxInfluence) maxInfluence = influence;
          }
        }
        const tw =
          Math.sin(dot.x * config.twinkleScale + dot.y * config.twinkleScale * 1.33 + time * config.twinkleSpeed + dot.seed) * 0.5 + 0.5;
        maxInfluence = Math.max(maxInfluence, tw * config.twinkleAmount);
        dot.opacity = config.minOpacity + opacityRange * maxInfluence;
      }

      const buckets = new Map<number, Dot[]>();
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const quantized = Math.round(dot.opacity * 20) / 20;
        let b = buckets.get(quantized);
        if (!b) { b = []; buckets.set(quantized, b); }
        b.push(dot);
      }
      const [r, g, b] = hexToRgb(colorRef.current);
      const halfSize = config.dotSize / 2;
      ctx!.globalAlpha = opacityRef.current;
      buckets.forEach((dotsInBucket, op) => {
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${op})`;
        ctx!.beginPath();
        for (let i = 0; i < dotsInBucket.length; i++) {
          const dot = dotsInBucket[i];
          ctx!.rect(dot.x - halfSize, dot.y - halfSize, config.dotSize, config.dotSize);
        }
        ctx!.fill();
      });
      ctx!.globalAlpha = 1;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animate(timestamp: number) {
      const deltaTime = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
      lastTime = timestamp;
      time += config.animationSpeed * deltaTime * 60;
      drawFrame();
      rafId = requestAnimationFrame(animate);
    }

    function resize() {
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      if (W === 0 || H === 0) return;
      canvas!.width = Math.max(1, Math.floor(W * dpr));
      canvas!.height = Math.max(1, Math.floor(H * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initSquiggles();
      initializeDots();
      if (reduceMotion) drawFrame();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    if (!reduceMotion) rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} aria-hidden />;
};

export default DotGridCanvas;
