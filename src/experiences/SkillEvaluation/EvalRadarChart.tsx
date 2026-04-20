import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { EvalJudgeScore } from '@/types/skillEvaluation';
import styles from './SkillEvaluation.module.scss';

interface EvalRadarChartProps {
  scores: EvalJudgeScore[];
  highlightedCriterion?: string;
  onHoverCriterion?: (name: string | null) => void;
}

const CX = 200, CY = 200, MAX_R = 140;
const THRESHOLD = 4.0;

function formatLabel(name: string): string {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function polarXY(i: number, n: number, score: number): [number, number] {
  const angle = (2 * Math.PI * i / n) - Math.PI / 2;
  const r = (score / 5) * MAX_R;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function labelXY(i: number, n: number) {
  const angle = (2 * Math.PI * i / n) - Math.PI / 2;
  const r = MAX_R + 24;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function polygonPoints(n: number, score: number): string {
  return Array.from({ length: n }, (_, i) => polarXY(i, n, score).join(',')).join(' ');
}

function sevClass(score: number): string {
  return score >= THRESHOLD ? 'pass' : 'fail';
}

/** Custom SVG radar chart matching the polished prototype design. */
export const EvalRadarChart: React.FC<EvalRadarChartProps> = ({ scores, highlightedCriterion, onHoverCriterion }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const data = useMemo(() => scores.map(s => ({
    id: s.name,
    name: formatLabel(s.name),
    score: s.score,
    maxScore: s.maxScore,
  })), [scores]);

  // Dynamic viewBox to prevent label clipping
  useEffect(() => {
    if (!svgRef.current || data.length < 3) return;
    requestAnimationFrame(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const bbox = svg.getBBox();
      const pad = 14;
      svg.setAttribute('viewBox',
        `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`);
    });
  }, [data]);

  const handleMouseEnter = useCallback((name: string) => {
    onHoverCriterion?.(name);
  }, [onHoverCriterion]);

  const handleMouseLeave = useCallback(() => {
    onHoverCriterion?.(null);
  }, [onHoverCriterion]);

  if (data.length < 3) return null;

  const n = data.length;

  return (
    <div className={styles.radarContainer}>
      <svg ref={svgRef} className={styles.radarSvg} viewBox="-30 -10 460 430" style={{ overflow: 'visible' }}>
        {/* Grid rings */}
        {[1, 2, 3, 4, 5].map(s => (
          <polygon
            key={s}
            className={s === 4 ? styles.radarThresholdRing : styles.radarGrid}
            points={polygonPoints(n, s)}
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const [ex, ey] = polarXY(i, n, 5);
          return <line key={i} className={styles.radarAxis} x1={CX} y1={CY} x2={ex} y2={ey} />;
        })}

        {/* Score area polygon */}
        <polygon
          className={styles.radarArea}
          points={data.map((c, i) => polarXY(i, n, c.score).join(',')).join(' ')}
        />

        {/* Dots + labels */}
        {data.map((c, i) => {
          const [dx, dy] = polarXY(i, n, c.score);
          const sv = sevClass(c.score);
          const lbl = labelXY(i, n);
          const isHighlighted = highlightedCriterion === c.id;
          let anchor = 'middle';
          if (lbl.x > CX + 20) anchor = 'start';
          else if (lbl.x < CX - 20) anchor = 'end';

          return (
            <g key={c.id}>
              <g
                className={`${styles.radarDotGroup} ${sv === 'pass' ? styles.radarDotPass : styles.radarDotFail} ${isHighlighted ? styles.radarDotHighlighted : ''}`}
                onMouseEnter={() => handleMouseEnter(c.id)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                <circle className={styles.dotRing} cx={dx} cy={dy} r={18} />
                <circle className={styles.dotBg} cx={dx} cy={dy} r={12} />
                <text className={styles.dotLabel} x={dx} y={dy}>{Math.round(c.score)}</text>
              </g>
              <text className={styles.radarCriterionLabel} x={lbl.x} y={lbl.y} textAnchor={anchor}>
                {c.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className={styles.radarLegend}>
        <span className={styles.radarLegendDot} style={{ background: 'var(--colorPaletteRedBackground3)' }} />
        Below threshold
        &nbsp;&nbsp;
        <span className={styles.radarLegendDot} style={{ background: 'var(--colorPaletteGreenBackground3)' }} />
        Meets threshold
        &nbsp;&nbsp;
        <span style={{ display: 'inline-block', width: 12, borderTop: '1.5px dashed var(--colorPaletteRedForeground1)', verticalAlign: 'middle', marginRight: 4, opacity: 0.35 }} />
        Threshold ({THRESHOLD.toFixed(1)})
      </div>
    </div>
  );
};

export default React.memo(EvalRadarChart);
