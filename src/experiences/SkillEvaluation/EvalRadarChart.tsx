import React, { useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { EvalJudgeScore } from '@/types/skillEvaluation';

interface EvalRadarChartProps {
  scores: EvalJudgeScore[];
}

function formatLabel(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Wraps long axis labels into multiple lines. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderMultiLineLabel(props: any) {
  const { payload, x, y, cx, cy } = props;
  const words = payload.value.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (current && (current + ' ' + w).length > 14) {
      lines.push(current);
      current = w;
    } else {
      current = current ? current + ' ' + w : w;
    }
  }
  if (current) lines.push(current);

  const anchor = x > cx ? 'start' : x < cx ? 'end' : 'middle';
  const dy = y > cy ? 4 : y < cy ? -4 : 0;

  return (
    <text x={x} y={y + dy} textAnchor={anchor} fontSize={11} fill="var(--colorNeutralForeground3)">
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 14}>{line}</tspan>
      ))}
    </text>
  );
}

function dotColor(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) return '#107C10'; // green
  if (ratio >= 0.6) return '#CA5010'; // orange
  return '#D13438';                   // red
}

/** Custom dot with score label. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderDot(props: any) {
  const { cx, cy, index, payload } = props;
  const color = dotColor(payload.value, payload.fullMark);
  return (
    <g key={index}>
      <Dot cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fontWeight={600} fill={color}>
        {payload.value}
      </text>
    </g>
  );
}

/** Radar chart visualising quality-assessment criteria. Needs ≥ 3 scores. */
export const EvalRadarChart: React.FC<EvalRadarChartProps> = ({ scores }) => {
  const data = useMemo(
    () =>
      scores.map((s) => ({
        name: formatLabel(s.name),
        value: s.score,
        fullMark: s.maxScore,
      })),
    [scores],
  );

  if (data.length < 3) return null;

  const maxScore = Math.max(...scores.map((s) => s.maxScore), 5);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%">
        <PolarGrid stroke="var(--colorNeutralStroke2)" />
        <PolarAngleAxis
          dataKey="name"
          tick={renderMultiLineLabel}
        />
        <PolarRadiusAxis domain={[0, maxScore]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="var(--colorBrandForeground1)"
          fill="var(--colorBrandForeground1)"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={renderDot}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(EvalRadarChart);
