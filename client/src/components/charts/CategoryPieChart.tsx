import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatCurrency } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';

const colors = [
  'rgb(var(--color-chart-1))',
  'rgb(var(--color-chart-2))',
  'rgb(var(--color-chart-3))',
  'rgb(var(--color-chart-4))',
  'rgb(var(--color-chart-5))',
];

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { settings } = useAppData();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const lead = data[0];
  const leadShare = lead && total > 0 ? Math.round((lead.value / total) * 100) : 0;

  return (
    <Card className="bg-surface-container-low">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-on-surface sm:text-lg">Category Breakdown</h3>
        <MaterialIcon name="more_horiz" className="text-on-surface-variant" />
      </div>

      <div className="relative mt-5 h-52 sm:mt-8 sm:h-60">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={colors[index % colors.length]}
                  opacity={index === 0 ? 1 : 0.82}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value, settings.currency)}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid rgb(var(--color-outline-variant) / 0.2)',
                background: 'rgb(var(--color-surface-container-lowest) / 0.96)',
                color: 'rgb(var(--color-on-surface))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
            {leadShare}%
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
            {lead?.name ?? 'No data'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span>{item.name}</span>
            </div>
            <span className="font-bold text-on-surface">
              {formatCurrency(item.value, settings.currency)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
