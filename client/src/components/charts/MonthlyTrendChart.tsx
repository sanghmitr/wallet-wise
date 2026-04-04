import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatCompactCurrency } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; value: number }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const { settings } = useAppData();

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
              tick={{ fill: 'rgb(var(--color-on-surface-variant))', fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) =>
                formatCompactCurrency(value, settings.currency)
              }
              cursor={{ fill: 'rgb(var(--color-outline-variant) / 0.12)' }}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid rgb(var(--color-outline-variant) / 0.2)',
                background: 'rgb(var(--color-surface-container-lowest) / 0.96)',
                color: 'rgb(var(--color-on-surface))',
              }}
            />
            <Bar
              dataKey="value"
              radius={[14, 14, 14, 14]}
              fill="rgb(var(--color-primary))"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
