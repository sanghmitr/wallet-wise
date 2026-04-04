import { useMemo, useRef, useState } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAppData } from '@/store/AppDataContext';
import type { Expense, PaymentMethod } from '@/types/domain';
import {
  getCategoryTotals,
  getPaymentMethodTotals,
  getSortedExpenses,
  sumExpenses,
} from '@/utils/analytics';

type DashboardRange = 'this-month' | 'last-30-days' | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

interface RangeChipProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

interface ProgressBarProps {
  value: number;
  tone: 'safe' | 'warning' | 'critical';
}

interface InsightRowProps {
  icon: string;
  title: string;
  description: string;
}

interface PaymentMethodBarProps {
  paymentMethod: PaymentMethod | null;
  amount: string;
  share: number;
}

function RangeChip({ label, icon, active, onClick }: RangeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200',
        active
          ? 'border-transparent bg-primary text-on-primary shadow-ambient'
          : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:border-primary/20 hover:text-on-surface',
      )}
    >
      <MaterialIcon
        name={icon}
        filled={active}
        className="text-[18px]"
      />
      <span>{label}</span>
    </button>
  );
}

function ProgressBar({ value, tone }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, value));
  const color =
    tone === 'safe'
      ? '#3b8f68'
      : tone === 'warning'
        ? '#c98635'
        : '#d05b64';

  return (
    <div
      className="h-3 overflow-hidden rounded-full"
      style={{ backgroundColor: `${color}1f` }}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${percentage}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        }}
      />
    </div>
  );
}

function InsightRow({ icon, title, description }: InsightRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-[1.25rem] bg-surface-container-lowest/92 p-3.5 transition-transform duration-200 active:scale-[0.99]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
        <MaterialIcon name={icon} className="text-[20px]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
          {description}
        </p>
      </div>
    </div>
  );
}

function PaymentMethodBar({
  paymentMethod,
  amount,
  share,
}: PaymentMethodBarProps) {
  return (
    <Link
      to={
        paymentMethod
          ? `/profile/payment-methods/${paymentMethod.id}`
          : '/profile'
      }
      className="block rounded-[1.35rem] border border-outline-variant/18 bg-surface-container-lowest/88 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-surface">
            {paymentMethod?.name ?? 'Unknown method'}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {share.toFixed(0)}% of selected spend
          </p>
        </div>
        <MaterialIcon
          name="arrow_outward"
          className="shrink-0 text-[18px] text-on-surface-variant"
        />
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, share)}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-semibold text-on-surface">
        {amount}
      </p>
    </Link>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return `rgba(168, 122, 84, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function clampRange(start: Date, end: Date): DateRange {
  if (isAfter(start, end)) {
    return { start: end, end: start };
  }

  return { start, end };
}

function getRangeBounds(
  range: DashboardRange,
  customStart: string,
  customEnd: string,
): DateRange {
  const today = new Date();

  if (range === 'last-30-days') {
    return {
      start: startOfDay(subDays(today, 29)),
      end: endOfDay(today),
    };
  }

  if (range === 'custom') {
    const fallbackStart = startOfDay(subDays(today, 6));
    const fallbackEnd = endOfDay(today);
    const start = customStart
      ? startOfDay(parseISO(customStart))
      : fallbackStart;
    const end = customEnd ? endOfDay(parseISO(customEnd)) : fallbackEnd;

    return clampRange(start, end);
  }

  return {
    start: startOfMonth(today),
    end: endOfDay(today),
  };
}

function getPreviousRange(bounds: DateRange, range: DashboardRange): DateRange {
  if (range === 'this-month') {
    const previousMonth = subDays(startOfMonth(bounds.start), 1);

    return {
      start: startOfMonth(previousMonth),
      end: endOfMonth(previousMonth),
    };
  }

  const duration = differenceInCalendarDays(
    startOfDay(bounds.end),
    startOfDay(bounds.start),
  );
  const previousEnd = endOfDay(addDays(bounds.start, -1));
  const previousStart = startOfDay(addDays(previousEnd, -duration));

  return {
    start: previousStart,
    end: previousEnd,
  };
}

function filterExpensesByDateBounds(expenses: Expense[], bounds: DateRange) {
  return expenses.filter((expense) =>
    isWithinInterval(parseISO(expense.date), bounds),
  );
}

function getRangeLabel(range: DashboardRange, bounds: DateRange) {
  if (range === 'this-month') {
    return 'This month';
  }

  if (range === 'last-30-days') {
    return 'Last 30 days';
  }

  return `${format(bounds.start, 'd MMM')} - ${format(bounds.end, 'd MMM')}`;
}

function getComparisonLabel(range: DashboardRange) {
  if (range === 'this-month') {
    return 'vs last month';
  }

  if (range === 'last-30-days') {
    return 'vs previous 30 days';
  }

  return 'vs previous range';
}

function getBudgetTone(usage: number): ProgressBarProps['tone'] {
  if (usage >= 0.85) {
    return 'critical';
  }

  if (usage >= 0.6) {
    return 'warning';
  }

  return 'safe';
}

function getBudgetToneColor(tone: ProgressBarProps['tone']) {
  if (tone === 'critical') {
    return '#d05b64';
  }

  if (tone === 'warning') {
    return '#c98635';
  }

  return '#3b8f68';
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function DashboardPage() {
  const {
    expenses,
    budgets,
    categories,
    paymentMethods,
    settings,
    authProfile,
    openCreateExpense,
    openEditExpense,
    deleteExpense,
  } = useAppData();

  const [range, setRange] = useState<DashboardRange>('this-month');
  const [customStart, setCustomStart] = useState(
    format(subDays(new Date(), 6), 'yyyy-MM-dd'),
  );
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | 'all'
  >('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const insightsRef = useRef<HTMLDivElement | null>(null);

  const bounds = getRangeBounds(range, customStart, customEnd);
  const previousBounds = getPreviousRange(bounds, range);

  const rangeExpenses = filterExpensesByDateBounds(expenses, bounds);
  const previousExpenses = filterExpensesByDateBounds(expenses, previousBounds);
  const totalSpent = sumExpenses(rangeExpenses);
  const previousTotal = sumExpenses(previousExpenses);
  const deltaAmount = totalSpent - previousTotal;
  const deltaPercentage =
    previousTotal > 0 ? (deltaAmount / previousTotal) * 100 : 0;
  const isSpendingUp = deltaAmount > 0;

  const categoryTotals = getCategoryTotals(rangeExpenses);
  const topCategory = categoryTotals[0] ?? null;
  const topCategoryRecord = topCategory
    ? categories.find((category) => category.name === topCategory.name) ?? null
    : null;
  const topCategoryShare = totalSpent > 0 ? (topCategory?.value ?? 0) / totalSpent : 0;

  const paymentMethodTotals = getPaymentMethodTotals(rangeExpenses)
    .map((item) => ({
      ...item,
      paymentMethod:
        paymentMethods.find((paymentMethod) => paymentMethod.name === item.name) ??
        null,
    }))
    .slice(0, 4);

  const paymentMethodOptions = paymentMethods.filter((paymentMethod) =>
    rangeExpenses.some((expense) => expense.paymentMethodId === paymentMethod.id),
  );
  const categoryOptions = categories.filter((category) =>
    rangeExpenses.some((expense) => expense.category === category.name),
  );

  const transactionExpenses = getSortedExpenses(
    rangeExpenses.filter((expense) => {
      if (
        selectedPaymentMethodId !== 'all' &&
        expense.paymentMethodId !== selectedPaymentMethodId
      ) {
        return false;
      }

      if (selectedCategory !== 'all' && expense.category !== selectedCategory) {
        return false;
      }

      return true;
    }),
  );

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetUsage = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const budgetRemainingPercent =
    totalBudget > 0 ? Math.max(0, ((totalBudget - totalSpent) / totalBudget) * 100) : 0;
  const budgetTone = getBudgetTone(budgetUsage);
  const budgetToneColor = getBudgetToneColor(budgetTone);

  const paymentMethodLeader = paymentMethodTotals[0] ?? null;
  const paymentMethodLeaderShare =
    totalSpent > 0 ? ((paymentMethodLeader?.value ?? 0) / totalSpent) * 100 : 0;

  const highlightInsights = useMemo(() => {
    if (!rangeExpenses.length) {
      return [
        {
          icon: 'lightbulb',
          title: 'Start with a few expenses',
          description:
            'Add your first transactions to unlock category patterns, budget context, and smart summaries here.',
        },
        {
          icon: 'target',
          title: 'Set a monthly budget',
          description:
            'Budget tracking becomes far more useful once each important category has a limit attached to it.',
        },
      ];
    }

    const insights = [];

    if (previousTotal > 0) {
      insights.push({
        icon: isSpendingUp ? 'trending_up' : 'trending_down',
        title: `${Math.abs(deltaPercentage).toFixed(0)}% ${
          isSpendingUp ? 'higher' : 'lower'
        } spend`,
        description: `${getRangeLabel(range, bounds)} is ${isSpendingUp ? 'up' : 'down'} by ${formatCurrency(
          Math.abs(deltaAmount),
          settings.currency,
        )} ${getComparisonLabel(range)}.`,
      });
    }

    if (topCategory) {
      insights.push({
        icon: topCategoryRecord?.icon ?? 'category',
        title: `${topCategory.name} is driving most spend`,
        description: `${formatPercent(topCategoryShare * 100)} of this range sits in ${topCategory.name}, totaling ${formatCurrency(
          topCategory.value,
          settings.currency,
        )}.`,
      });
    }

    if (totalBudget > 0) {
      insights.push({
        icon: budgetUsage >= 1 ? 'warning' : 'savings',
        title:
          budgetUsage >= 1
            ? 'Budget exceeded'
            : `${formatPercent(budgetRemainingPercent)} budget left`,
        description:
          budgetUsage >= 1
            ? `You are ${formatCurrency(Math.abs(remainingBudget), settings.currency)} over your active budget.`
            : `${formatCurrency(
                Math.max(remainingBudget, 0),
                settings.currency,
              )} remains from your ${formatCurrency(totalBudget, settings.currency)} budget.`,
      });
    } else if (paymentMethodLeader) {
      insights.push({
        icon: 'payments',
        title: `${paymentMethodLeader.name} leads usage`,
        description: `${formatPercent(paymentMethodLeaderShare)} of selected spending happened through ${paymentMethodLeader.name}.`,
      });
    }

    return insights.slice(0, 3);
  }, [
    bounds,
    budgetRemainingPercent,
    budgetUsage,
    deltaAmount,
    deltaPercentage,
    isSpendingUp,
    paymentMethodLeader,
    paymentMethodLeaderShare,
    previousTotal,
    range,
    rangeExpenses.length,
    remainingBudget,
    settings.currency,
    topCategory,
    topCategoryRecord?.icon,
    topCategoryShare,
    totalBudget,
  ]);

  const hasTransactionFilters =
    selectedPaymentMethodId !== 'all' || selectedCategory !== 'all';

  function handleRangeChange(nextRange: DashboardRange) {
    setRange(nextRange);

    if (nextRange === 'custom' && (!customStart || !customEnd)) {
      setCustomStart(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
      setCustomEnd(format(new Date(), 'yyyy-MM-dd'));
    }
  }

  function handleViewInsights() {
    insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="space-y-6 pb-24 animate-float-in sm:space-y-7 lg:pb-8">
      <header className="space-y-4">
        <div className="hidden items-center justify-between lg:flex">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Wallet Wise
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-on-surface">
              Spend with clarity
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/24 bg-surface-container-lowest/88 text-on-surface-variant transition hover:text-on-surface"
              aria-label="Notifications"
            >
              <MaterialIcon name="notifications_none" className="text-[20px]" />
            </button>
            <Link
              to="/profile"
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-outline-variant/24 bg-surface-container-lowest/88 text-on-surface-variant transition hover:text-on-surface"
              aria-label="Profile"
            >
              {authProfile?.photoURL ? (
                <img
                  src={authProfile.photoURL}
                  alt={authProfile.displayName || 'Profile'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <MaterialIcon name="person" className="text-[20px]" />
              )}
            </Link>
          </div>
        </div>

        <div className="lg:hidden">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
            {rangeExpenses.length
              ? `Tracking ${getRangeLabel(range, bounds)}`
              : 'Your mobile dashboard'}
          </p>
          <h1 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-on-surface">
            Spend with clarity
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-on-surface-variant">
            Clean insights, less noise, and your next action always within reach.
          </p>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <RangeChip
            label="This Month"
            icon="calendar_month"
            active={range === 'this-month'}
            onClick={() => handleRangeChange('this-month')}
          />
          <RangeChip
            label="Last 30 Days"
            icon="history"
            active={range === 'last-30-days'}
            onClick={() => handleRangeChange('last-30-days')}
          />
          <RangeChip
            label="Custom Range"
            icon="date_range"
            active={range === 'custom'}
            onClick={() => handleRangeChange('custom')}
          />
        </div>

        {range === 'custom' ? (
          <Card className="surface-ring bg-surface-container-low p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Start
                </span>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="w-full rounded-[1rem] border-none bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  End
                </span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="w-full rounded-[1rem] border-none bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none"
                />
              </label>
            </div>
          </Card>
        ) : null}
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
        <Card className="surface-ring relative overflow-hidden bg-surface-container-low p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-12%] top-[-18%] h-40 w-40 rounded-full bg-primary/16 blur-3xl" />
            <div className="absolute bottom-[-22%] right-[-8%] h-36 w-36 rounded-full bg-[#4d8f78]/12 blur-3xl" />
          </div>

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Total Spent
                </p>
                <h2 className="mt-3 text-[2rem] font-extrabold tracking-tight text-on-surface sm:text-[2.4rem]">
                  {formatCurrency(totalSpent, settings.currency)}
                </h2>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/92 px-3 py-2 text-xs font-semibold text-on-surface">
                  <MaterialIcon
                    name={isSpendingUp ? 'trending_up' : 'trending_down'}
                    className={cn(
                      'text-[18px]',
                      isSpendingUp ? 'text-[#b9634b]' : 'text-[#3b8f68]',
                    )}
                  />
                  <span>
                    {previousTotal > 0
                      ? `${isSpendingUp ? '+' : '-'}${Math.abs(
                          deltaPercentage,
                        ).toFixed(0)}% ${getComparisonLabel(range)}`
                      : 'No prior range to compare yet'}
                  </span>
                </div>
              </div>

              <div className="rounded-[1.2rem] bg-surface-container-lowest/92 px-3 py-2 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Active Range
                </p>
                <p className="mt-1 text-sm font-semibold text-on-surface">
                  {getRangeLabel(range, bounds)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button className="gap-2 px-4 py-3" onClick={handleViewInsights}>
                <MaterialIcon name="insights" className="text-[18px]" />
                View Insights
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="surface-ring bg-surface-container-low p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Remaining Budget
                </p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight text-on-surface">
                  {totalBudget > 0
                    ? formatPercent(budgetRemainingPercent)
                    : '--'}
                </p>
              </div>
              <div
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  color: budgetToneColor,
                  backgroundColor: `${budgetToneColor}17`,
                }}
              >
                {budgetTone === 'safe'
                  ? 'Healthy'
                  : budgetTone === 'warning'
                    ? 'Watch'
                    : 'Critical'}
              </div>
            </div>

            <div className="mt-5">
              <ProgressBar value={Math.min(budgetUsage * 100, 100)} tone={budgetTone} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {totalBudget > 0
                    ? `${formatCurrency(
                        Math.max(remainingBudget, 0),
                        settings.currency,
                      )} left`
                    : 'No budgets added yet'}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {totalBudget > 0
                    ? `Out of ${formatCurrency(totalBudget, settings.currency)} budget`
                    : 'Create budgets to unlock spend pacing'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-on-surface">
                  {formatCurrency(totalSpent, settings.currency)}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">spent</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section ref={insightsRef} className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="surface-ring bg-surface-container-low p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Smart Insights
              </p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-on-surface">
                What needs attention
              </h2>
            </div>
            <Link
              to="/chat"
              aria-label="Open AI assistant"
              className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary transition-transform duration-200 hover:scale-105"
              style={{
                boxShadow: '0 0 0 1px rgba(168, 122, 84, 0.1), 0 0 24px rgba(168, 122, 84, 0.24)',
              }}
            >
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75" />
              <span className="absolute inset-[6px] rounded-full bg-primary/10 blur-md" />
              <span className="relative z-10 flex h-full w-full items-center justify-center">
                <MaterialIcon name="auto_awesome" className="text-[20px]" />
              </span>
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {highlightInsights.map((insight) => (
              <InsightRow
                key={insight.title}
                icon={insight.icon}
                title={insight.title}
                description={insight.description}
              />
            ))}
          </div>
        </Card>

        <Card className="surface-ring bg-surface-container-low p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Payment Method Spend
              </p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-on-surface">
                Where you paid from
              </h2>
            </div>
            <div className="rounded-full bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface">
              {paymentMethodTotals.length} methods
            </div>
          </div>

          {!paymentMethodTotals.length ? (
            <div className="mt-5 rounded-[1.4rem] bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
              Spend will start grouping by payment method once you add transactions.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {paymentMethodTotals.map((item) => (
                <PaymentMethodBar
                  key={item.name}
                  paymentMethod={item.paymentMethod}
                  amount={formatCompactCurrency(item.value, settings.currency)}
                  share={totalSpent > 0 ? (item.value / totalSpent) * 100 : 0}
                />
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Transactions
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-on-surface">
              Focused transaction view
            </h2>
          </div>

          {hasTransactionFilters ? (
            <button
              type="button"
              onClick={() => {
                setSelectedPaymentMethodId('all');
                setSelectedCategory('all');
              }}
              className="text-sm font-semibold text-primary"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <Card className="surface-ring bg-surface-container-low p-4 sm:p-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Payment Method
              </p>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethodId('all')}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-semibold transition',
                    selectedPaymentMethodId === 'all'
                      ? 'bg-primary text-on-primary shadow-ambient'
                      : 'bg-surface-container-lowest text-on-surface-variant',
                  )}
                >
                  All methods
                </button>
                {paymentMethodOptions.map((paymentMethod) => (
                  <button
                    key={paymentMethod.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethodId(paymentMethod.id)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition',
                      selectedPaymentMethodId === paymentMethod.id
                        ? 'bg-primary text-on-primary shadow-ambient'
                        : 'bg-surface-container-lowest text-on-surface-variant',
                    )}
                  >
                    {paymentMethod.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Category
              </p>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-semibold transition',
                    selectedCategory === 'all'
                      ? 'bg-primary text-on-primary shadow-ambient'
                      : 'bg-surface-container-lowest text-on-surface-variant',
                  )}
                >
                  All categories
                </button>
                {categoryOptions.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition',
                      selectedCategory === category.name
                        ? 'text-white shadow-ambient'
                        : 'bg-surface-container-lowest text-on-surface-variant',
                    )}
                    style={
                      selectedCategory === category.name
                        ? {
                            backgroundColor: category.color,
                          }
                        : undefined
                    }
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {!expenses.length ? (
          <EmptyState
            title="No expenses yet"
            description="Add your first expense to start seeing smart summaries, budget pace, and a cleaner transaction history."
            actionLabel="Add expense"
            onAction={openCreateExpense}
          />
        ) : (
          <RecentTransactions
            expenses={transactionExpenses}
            title="Recent transactions"
            description={`Showing ${transactionExpenses.length} transactions for ${getRangeLabel(
              range,
              bounds,
            ).toLowerCase()}.`}
            onEdit={openEditExpense}
            onDelete={(expenseId) => void deleteExpense(expenseId)}
          />
        )}
      </section>
    </div>
  );
}
