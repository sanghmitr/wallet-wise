import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';

const colors = [
  'rgb(var(--color-chart-1))',
  'rgb(var(--color-chart-2))',
  'rgb(var(--color-chart-3))',
  'rgb(var(--color-chart-4))',
  'rgb(var(--color-chart-5))',
];

interface PaymentMethodSpendChartProps {
  data: Array<{ name: string; value: number }>;
}

function truncateLabel(label: string) {
  return label.length > 12 ? `${label.slice(0, 12)}...` : label;
}

export function PaymentMethodSpendChart({
  data,
}: PaymentMethodSpendChartProps) {
  const { settings } = useAppData();
  const topMethods = data.slice(0, 5);

  return (
    <Card className="bg-surface-container-low">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-on-surface sm:text-lg">
          Payment Method Spend
        </h3>
        <MaterialIcon name="payments" className="text-on-surface-variant" />
      </div>

      <div className="mt-5 h-56 sm:mt-8 sm:h-64">
        <ResponsiveContainer>
          <BarChart
            data={topMethods}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
            barCategoryGap={14}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={96}
              tick={{ fill: 'rgb(var(--color-on-surface-variant))', fontSize: 11 }}
              tickFormatter={truncateLabel}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value, settings.currency)}
              cursor={{ fill: 'rgb(var(--color-outline-variant) / 0.12)' }}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid rgb(var(--color-outline-variant) / 0.2)',
                background: 'rgb(var(--color-surface-container-lowest) / 0.96)',
                color: 'rgb(var(--color-on-surface))',
              }}
            />
            <Bar dataKey="value" radius={[10, 10, 10, 10]}>
              {topMethods.map((item, index) => (
                <Cell
                  key={item.name}
                  fill={colors[index % colors.length]}
                  opacity={index === 0 ? 1 : 0.88}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2.5">
        {topMethods.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2 text-on-surface-variant">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="shrink-0 font-bold text-on-surface">
              {formatCompactCurrency(item.value, settings.currency)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
