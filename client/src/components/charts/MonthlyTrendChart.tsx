import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatCompactCurrency } from '@/lib/format';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; value: number }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <Card className="bg-surface-container-low">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-on-surface">Monthly Trend</h3>
        <MaterialIcon name="more_horiz" className="text-on-surface-variant" />
      </div>

      <div className="mt-8 h-64">
        <ResponsiveContainer>
          <BarChart data={data} barCategoryGap={18}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#586064', fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) => formatCompactCurrency(value)}
              cursor={{ fill: 'rgba(171, 179, 183, 0.12)' }}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid rgba(171, 179, 183, 0.15)',
                background: 'rgba(255,255,255,0.95)',
              }}
            />
            <Bar dataKey="value" radius={[14, 14, 14, 14]} fill="#5f5e5e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
