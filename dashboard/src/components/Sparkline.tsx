import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import type { HistoryPoint } from '../types';

interface Props {
  history: HistoryPoint[];
  color: string;
}

/** Tiny latency sparkline of the recent checks. */
export default function Sparkline({ history, color }: Props) {
  const data = history
    .filter((h) => h.responseTimeMs != null)
    .map((h, i) => ({ i, ms: h.responseTimeMs as number }));

  if (data.length < 2) {
    return <div className="spark spark--empty">—</div>;
  }

  return (
    <div className="spark">
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={data} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="ms"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
