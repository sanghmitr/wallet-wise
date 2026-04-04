import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatCurrency } from '@/lib/format';

const colors = ['#5f5e5e', '#7a8799', '#7a778f', '#a79892', '#bf7b77'];

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const lead = data[0];
  const leadShare = lead && total > 0 ? Math.round((lead.value / total) * 100) : 0;

  return (
    <Card className="bg-surface-container-low">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-on-surface">Category Breakdown</h3>
        <MaterialIcon name="more_horiz" className="text-on-surface-variant" />
      </div>

      <div className="relative mt-8 h-60">
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
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid rgba(171, 179, 183, 0.15)',
                background: 'rgba(255,255,255,0.95)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black tracking-tight text-on-surface">
            {leadShare}%
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
            {lead?.name ?? 'No data'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
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
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
