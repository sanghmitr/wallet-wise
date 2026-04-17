import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { useAppData } from '@/store/AppDataContext';
import { cn } from '@/lib/utils';

interface AuthGateProps {
  bootstrapError: string | null;
  onGoogleSignIn: () => Promise<void>;
  onContinueAsGuest: () => Promise<void>;
}

type ShowcaseTabId = 'analytics' | 'automation' | 'insights' | 'security';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Product', href: '#product' },
];

const featureCards = [
  {
    icon: 'auto_graph',
    title: 'Adaptive analytics',
    body:
      'Track category drift and spending pace from one readable board.',
    note: 'faster monthly reviews',
    span: 'lg:col-span-1',
    surface:
      'bg-[linear-gradient(180deg,rgba(19,20,29,0.96),rgba(15,16,24,0.92))] border-[rgba(120,127,255,0.14)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(102,110,255,0.18),transparent_40%)]',
    iconSurface: 'bg-[rgba(102,110,255,0.2)] text-[#7f86ff]',
  },
  {
    icon: 'credit_card_heart',
    title: 'Billing cycle aware',
    body:
      'Follow real credit-card closing dates so reviews stay obvious.',
    note: 'early close alerts',
    span: 'lg:col-span-1',
    surface:
      'bg-[linear-gradient(180deg,rgba(18,22,27,0.96),rgba(14,18,23,0.92))] border-[rgba(82,194,160,0.14)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(0,168,126,0.16),transparent_40%)]',
    iconSurface: 'bg-[rgba(0,168,126,0.16)] text-[#5ad7b0]',
  },
  {
    icon: 'forum',
    title: 'AI insights',
    body:
      'Ask for summaries in plain language with AI-ready search.',
    note: 'AI assistant',
    span: 'lg:col-span-1',
    surface:
      'bg-[linear-gradient(180deg,rgba(22,20,32,0.96),rgba(17,16,25,0.92))] border-[rgba(147,109,98,0.16)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(147,109,98,0.18),transparent_42%)]',
    iconSurface: 'bg-[rgba(147,109,98,0.16)] text-[#c9a398]',
  },
  {
    icon: 'shield_lock',
    title: 'Private by default',
    body:
      'Store payment nicknames, not sensitive banking details.',
    note: 'No card details stored',
    span: 'lg:col-span-1',
    surface:
      'bg-[linear-gradient(180deg,rgba(17,20,24,0.96),rgba(13,16,19,0.92))] border-[rgba(115,128,147,0.16)]',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(115,128,147,0.18),transparent_40%)]',
    iconSurface: 'bg-[rgba(115,128,147,0.16)] text-[#b0bccd]',
  },
];

const showcaseTabs: Array<{
  id: ShowcaseTabId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  list: string[];
  accent: string;
}> = [
  {
    id: 'analytics',
    label: 'Analytics',
    eyebrow: 'Live clarity',
    title: 'Track the shape of spending, not just the total.',
    description:
      'Surface filtered totals, top payment methods, budget pace, and month-over-month movement in one premium view.',
    metrics: [
      { label: 'Spent this month', value: 'Rs 28.4k' },
      { label: 'Budget remaining', value: '38%' },
      { label: 'Top driver', value: 'Food & Dining' },
    ],
    list: [
      'Focused transaction totals update instantly with filters.',
      'Category and payment views stay readable on mobile and desktop.',
      'Key metrics are visible before you ever scroll into the detail layer.',
    ],
    accent: 'from-[#4f55f1]/20 via-[#4f55f1]/8 to-transparent',
  },
  {
    id: 'automation',
    label: 'Automation',
    eyebrow: 'Operational calm',
    title: 'Reduce friction around everyday money maintenance.',
    description:
      'Keep wake flows, auto-focus, reset states, and confirmation patterns feeling deliberate instead of improvised.',
    metrics: [
      { label: 'Save success', value: '99.2%' },
      { label: 'Median entry time', value: '18 sec' },
      { label: 'Manual retries', value: '-41%' },
    ],
    list: [
      'Server readiness is visible before write actions begin.',
      'Reusable flows make mobile PWA interactions feel closer to native.',
      'High-friction edge cases are surfaced before they become user errors.',
    ],
    accent: 'from-[#00a87e]/20 via-[#00a87e]/8 to-transparent',
  },
  {
    id: 'insights',
    label: 'Insights',
    eyebrow: 'Decision layer',
    title: 'Turn raw transactions into a clearer money story.',
    description:
      'Blend real payment labels, card cycles, budgets, and AI summaries so the product feels advisory, not clerical.',
    metrics: [
      { label: 'Assistant prompts', value: 'Plain language' },
      { label: 'Billing window', value: '3 cards tracked' },
      { label: 'Budget risk', value: '2 categories' },
    ],
    list: [
      'Ask for filtered totals, spend patterns, or card-cycle summaries.',
      'Cross-reference budgets with actual behavior without leaving the dashboard.',
      'Keep every insight tied to the same transaction source of truth.',
    ],
    accent: 'from-[#936d62]/18 via-[#936d62]/8 to-transparent',
  },
  {
    id: 'security',
    label: 'Security',
    eyebrow: 'Built for trust',
    title: 'Keep confidence high without visual heaviness.',
    description:
      'Use restrained data collection, explicit state messaging, and polished confirmation patterns to make reliability visible.',
    metrics: [
      { label: 'Sensitive numbers stored', value: 'None' },
      { label: 'Delete confirmation', value: 'Always' },
      { label: 'Wake state', value: 'Visible' },
    ],
    list: [
      'Only payment nicknames and safe labels are used in the product layer.',
      'Destructive actions are confirmed with deliberate checkpoints.',
      'State transitions are explicit, calm, and readable under pressure.',
    ],
    accent: 'from-[#191c1f]/20 via-[#191c1f]/8 to-transparent',
  },
];

const heroTransactions = [
  { title: 'Blue Tokai', meta: 'Groceries • HDFC Credit Card', amount: 'Rs 1,540' },
  { title: 'Airport Metro', meta: 'Travel • personal@upi', amount: 'Rs 760' },
  { title: 'Movie Night', meta: 'Leisure • Cash', amount: 'Rs 900' },
];

const previewInsights = [
  {
    title: '29% higher spend',
    body: 'This month is up by Rs 13.1k vs last month.',
    icon: 'trending_up',
  },
  {
    title: 'Rent & Utilities is driving most spend',
    body: '29% of this range sits in Rent & Utilities.',
    icon: 'home_work',
  },
  {
    title: '39% budget left',
    body: 'Rs 37,355 remains from your Rs 96,000 budget.',
    icon: 'savings',
  },
];

const previewPaymentMethods = [
  { name: 'UPI', share: '67% of selected spend', amount: 'Rs 39.3k', width: '67%' },
  { name: 'SBI Click', share: '12% of selected spend', amount: 'Rs 7.1k', width: '12%' },
  { name: 'ICICI rubyx', share: '11% of selected spend', amount: 'Rs 6.7k', width: '11%' },
];

function PreviewSurface({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[1.9rem] border border-white/8 bg-[#14161d] p-4 text-white shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-5">
      {children}
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <PreviewSurface>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/46">
            Wallet Wise
          </p>
          <h3 className="mt-3 font-display text-[2rem] font-medium tracking-[-0.05em]">
            Spend with clarity
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 text-white/72">
            <MaterialIcon name="notifications_none" className="text-[18px]" />
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/14 bg-white/8 text-white/72">
            <MaterialIcon name="person" className="text-[18px]" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white">
          <MaterialIcon name="calendar_month" className="text-[18px]" />
          This Month
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-4 py-3 text-sm font-semibold text-white/72">
          <MaterialIcon name="history" className="text-[18px]" />
          Last 30 Days
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-4 py-3 text-sm font-semibold text-white/72">
          <MaterialIcon name="date_range" className="text-[18px]" />
          Custom Range
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[1.8rem] bg-white/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                Total Spent
              </p>
              <p className="mt-3 font-display text-[2.6rem] font-medium tracking-[-0.05em]">
                Rs 58,645.00
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/7 px-3 py-2 text-sm font-semibold text-white">
                <MaterialIcon name="trending_up" className="text-[18px] text-[#d97e57]" />
                +29% vs last month
              </div>
            </div>
            <div className="rounded-[1.2rem] bg-white/7 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/46">
                Active Range
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                This month
              </p>
            </div>
          </div>

          <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-display text-base font-medium text-[#191c1f]">
            <MaterialIcon name="insights" className="text-[18px]" />
            View Insights
          </button>
        </div>

        <div className="rounded-[1.8rem] bg-white/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                Remaining Budget
              </p>
              <p className="mt-3 font-display text-[2.2rem] font-medium tracking-[-0.05em]">
                39%
              </p>
            </div>
            <div className="rounded-full bg-[#d08f35]/16 px-3 py-1.5 text-xs font-semibold text-[#d08f35]">
              Watch
            </div>
          </div>

          <div className="mt-5 h-3 rounded-full bg-white/10">
            <div className="h-full w-[62%] rounded-full bg-[#d08f35]" />
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xl font-semibold text-white">Rs 37,355.00 left</p>
              <p className="mt-2 text-sm text-white/58">Out of Rs 96,000.00 budget</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-white">Rs 58,645.00</p>
              <p className="mt-2 text-sm text-white/58">spent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.8rem] bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                Smart Insights
              </p>
              <p className="mt-2 font-display text-[1.7rem] font-medium tracking-[-0.04em]">
                What needs attention
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
              <MaterialIcon name="auto_awesome" className="text-[20px]" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {previewInsights.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-[1.2rem] bg-white/6 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <MaterialIcon name={item.icon} className="text-[18px]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-white/58">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                Payment Method Spend
              </p>
              <p className="mt-2 font-display text-[1.7rem] font-medium tracking-[-0.04em]">
                Where you paid from
              </p>
            </div>
            <div className="rounded-full bg-white/7 px-3 py-1.5 text-xs font-semibold text-white">
              4 methods
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {previewPaymentMethods.map((item) => (
              <div
                key={item.name}
                className="rounded-[1.2rem] border border-white/10 bg-white/4 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-sm text-white/58">{item.share}</p>
                  </div>
                  <MaterialIcon name="arrow_outward" className="text-[20px] text-white/62" />
                </div>
                <div className="mt-4 h-3 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: item.width }} />
                </div>
                <p className="mt-4 text-xl font-semibold text-white">{item.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PreviewSurface>
  );
}

function AutomationPreview() {
  return (
    <PreviewSurface>
      <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <button className="rounded-full p-2 text-white/62">
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
          <p className="font-display text-xl font-medium tracking-[-0.03em] text-white">
            Add Transaction
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
          <MaterialIcon name="account_balance_wallet" filled className="text-[20px]" />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/46">Amount</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-3xl text-white/72">Rs</span>
            <span className="font-display text-[3rem] font-medium tracking-[-0.06em] text-white">
              1,540
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.3rem] bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/46">Category</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/18 px-3 py-2 text-sm font-semibold text-white">
              <MaterialIcon name="shopping_cart" className="text-[18px]" />
              Groceries
            </div>
          </div>
          <div className="rounded-[1.3rem] bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/46">Date</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/7 px-3 py-2 text-sm font-semibold text-white">
              <MaterialIcon name="calendar_month" className="text-[18px]" />
              17 Apr 2026
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/46">Payment Method</p>
            <p className="text-xs text-white/58">Choose one</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border border-primary/30 bg-primary/14 p-3">
              <p className="text-sm font-semibold text-white">HDFC Credit Card</p>
              <p className="mt-1 text-xs text-white/58">credit card</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/4 p-3">
              <p className="text-sm font-semibold text-white">personal@upi</p>
              <p className="mt-1 text-xs text-white/58">upi</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/4 p-3">
              <p className="text-sm font-semibold text-white">SBI Click</p>
              <p className="mt-1 text-xs text-white/58">debit card</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/4 p-3">
              <p className="text-sm font-semibold text-white">Cash</p>
              <p className="mt-1 text-xs text-white/58">cash</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/46">Note</p>
          <p className="mt-3 text-sm text-white">Blue Tokai coffee beans</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.6rem] bg-white/7 p-3">
        <button className="w-full rounded-full bg-white px-5 py-3.5 font-display text-base font-medium text-[#191c1f]">
          Save Transaction
        </button>
      </div>
    </PreviewSurface>
  );
}

function InsightsPreview() {
  return (
    <PreviewSurface>
      <div className="relative overflow-hidden rounded-[1.7rem] border border-white/6 bg-[#0d1017]">
        <div className="absolute inset-0 premium-grid opacity-30" />
        <div className="absolute left-[-8%] top-[-10%] h-48 w-48 rounded-full bg-primary/16 blur-3xl" />
        <div className="absolute right-[-6%] top-[8%] h-56 w-56 rounded-full bg-[#00a87e]/12 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/28 to-transparent" />

        <div className="relative flex min-h-[40rem] flex-col justify-between">
          <div className="px-5 pb-10 pt-9 sm:px-8 sm:pt-10">
            <div className="mx-auto max-w-6xl">
              <div className="ml-auto flex max-w-[52rem] items-start justify-end gap-4">
                <div className="min-w-0 flex-1">
                  <div className="rounded-[2rem] rounded-tr-[1.2rem] bg-primary px-6 py-5 text-[1.05rem] font-medium leading-8 text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] sm:text-[1.1rem]">
                    I spent 580 rs on starbucks using regalia credit card.
                  </div>
                  <p className="mt-4 px-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/56">
                    You • 11:14 PM
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/6 text-white/82">
                  <MaterialIcon name="person" className="text-[23px]" />
                </div>
              </div>

              <div className="mt-8 flex items-start gap-5">
                <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_20px_44px_rgba(99,102,241,0.24)]">
                  <MaterialIcon name="forum" filled className="text-[24px]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="max-w-[40rem] rounded-[2rem] rounded-tl-[1.2rem] border border-white/5 bg-[#161921] px-6 py-5 text-[1.05rem] leading-8 text-white shadow-[0_14px_34px_rgba(0,0,0,0.2)] sm:text-[1.1rem]">
                    Added Food & Dining expense for Rs580.00 at starbucks.
                  </div>

                  <div className="mt-5 max-w-[40rem] rounded-[2rem] border border-white/70 bg-[#12151d] px-6 py-5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-primary">
                          Expense Saved
                        </p>
                        <h4 className="mt-4 text-[1.05rem] font-semibold text-white sm:text-[1.2rem]">
                          starbucks
                        </h4>
                        <p className="mt-3 text-[1rem] text-white/58 sm:text-[1.05rem]">
                          Food & Dining • Regalia • Today
                        </p>
                      </div>
                      <p className="text-[1.25rem] font-semibold text-white sm:text-[1.45rem]">
                        ₹580.00
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid max-w-[40rem] gap-4 sm:grid-cols-3">
                    {[
                      { label: 'Matches', value: '1' },
                      { label: 'Total', value: '₹580.00' },
                      { label: 'Top Category', value: 'Food & Dining' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1.6rem] bg-[#12151d] px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.14)]"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/56">
                          {item.label}
                        </p>
                        <p className="mt-5 text-[1.1rem] font-semibold text-white sm:text-[1.2rem]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 px-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/56">
                    Assistant • 11:14 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/6 bg-[#11131a]/96 px-4 py-4 backdrop-blur-xl sm:px-5">
            <div className="rounded-[2rem] border border-white/5 bg-[#14161d] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-end gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/18 text-primary">
                  <MaterialIcon name="edit_note" className="text-[23px]" />
                </div>
                <div className="flex min-h-[52px] flex-1 items-center py-2 text-[1.05rem] text-white/34">
                  Message Wallet Wise about your spending...
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/68 text-[#14161d]">
                  <MaterialIcon name="arrow_upward" className="text-[21px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PreviewSurface>
  );
}

function SecurityPreview() {
  return (
    <PreviewSurface>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
            <span className="font-display text-lg font-medium">GU</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/46">Account</p>
            <p className="mt-1 text-xl font-semibold text-white">Guest User</p>
            <p className="mt-1 text-sm text-white/58">Signed in with Firebase guest mode</p>
          </div>
        </div>
        <div className="hidden gap-2 sm:grid sm:grid-cols-2">
          <div className="rounded-[1.1rem] bg-white/6 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/46">Account Type</p>
            <p className="mt-2 text-sm font-semibold text-white">Guest</p>
          </div>
          <div className="rounded-[1.1rem] bg-white/6 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/46">Theme</p>
            <p className="mt-2 text-sm font-semibold text-white">Dark</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-white/4 px-4 py-4 text-sm leading-6 text-white/62 sm:hidden">
        Payment nicknames only. Private details stay out of the product layer.
      </div>

      <div className="mt-6 hidden rounded-[1.6rem] bg-white/5 p-5 sm:block">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">Profile</p>
        <h3 className="mt-2 font-display text-[2rem] font-medium tracking-[-0.04em] text-white">
          Payment Methods
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
          The app stores only payment nicknames, never card numbers or private banking details.
        </p>

        <div className="mt-5 space-y-3">
          {[
            { name: 'Cash', meta: 'Cash • 0 transactions' },
            { name: 'HDFC Credit Card', meta: 'credit card • 12 transactions' },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/4 px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/18 text-primary">
                  <MaterialIcon name="payments" className="text-[18px]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm text-white/58">{item.meta}</p>
                </div>
              </div>
              <div className="rounded-full bg-white/7 px-3 py-1.5 text-xs font-semibold text-white">
                View
              </div>
            </div>
          ))}
        </div>
      </div>
    </PreviewSurface>
  );
}

function ProductPreview({
  activeTab,
}: {
  activeTab: ShowcaseTabId;
}) {
  if (activeTab === 'automation') {
    return <AutomationPreview />;
  }

  if (activeTab === 'insights') {
    return <InsightsPreview />;
  }

  if (activeTab === 'security') {
    return <SecurityPreview />;
  }

  return <AnalyticsPreview />;
}

function sectionReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.24 },
    transition: {
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };
}

function heroReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.72,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };
}

export function AuthGate({
  bootstrapError,
  onGoogleSignIn,
  onContinueAsGuest,
}: AuthGateProps) {
  const { settings, setThemePreference } = useAppData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavbarSolid, setIsNavbarSolid] = useState(false);
  const [activeTab, setActiveTab] = useState<ShowcaseTabId>('analytics');
  const [heroPointer, setHeroPointer] = useState({ x: 0, y: 0 });

  const isDarkTheme = settings.theme === 'dark';

  function handleThemeToggle() {
    setThemePreference(isDarkTheme ? 'light' : 'dark');
  }

  useEffect(() => {
    function handleScroll() {
      setIsNavbarSolid(window.scrollY > 18);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeShowcase =
    useMemo(
      () => showcaseTabs.find((item) => item.id === activeTab) ?? showcaseTabs[0],
      [activeTab],
    );

  function handleHeroMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;

    setHeroPointer({
      x: (relativeX - 0.5) * 2,
      y: (relativeY - 0.5) * 2,
    });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="premium-grid absolute inset-0 opacity-60" />
        <div className="absolute left-[-10%] top-[-8rem] h-[26rem] w-[26rem] rounded-full bg-primary/18 blur-3xl animate-glow-pulse" />
        <div className="absolute right-[-12%] top-[18rem] h-[24rem] w-[24rem] rounded-full bg-secondary/16 blur-3xl animate-slow-float" />
        <div className="absolute left-[32%] top-[42rem] h-[18rem] w-[18rem] rounded-full bg-tertiary/12 blur-3xl animate-glow-pulse" />
      </div>

      <motion.header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          isNavbarSolid ? 'pt-3' : 'pt-5',
        )}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={cn(
            'mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-3 sm:px-5',
            isNavbarSolid
              ? 'glass-panel w-[calc(100%-1.5rem)] shadow-ambient'
              : 'w-[calc(100%-1.5rem)] bg-transparent',
          )}
        >
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-on-surface text-background">
              <MaterialIcon
                name="account_balance_wallet"
                filled
                className="text-[22px]"
              />
            </div>
            <div>
              <p className="font-display text-[1.03rem] font-medium tracking-[-0.03em] text-on-surface">
                Wallet Wise
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="nav-underline-link font-display text-[0.96rem] font-medium tracking-[-0.01em] text-on-surface-variant transition hover:text-on-surface"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={handleThemeToggle}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/70 bg-surface-container-lowest/88 text-on-surface transition hover:scale-[1.02] hover:bg-surface-container-low"
              aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <MaterialIcon
                name={isDarkTheme ? 'light_mode' : 'dark_mode'}
                className="text-[20px]"
              />
            </button>
            <a
              href="#cta"
              className="inline-flex items-center justify-center rounded-full border border-on-surface bg-on-surface px-6 py-3.5 font-display text-[0.95rem] font-medium tracking-[-0.01em] text-background transition hover:scale-[1.02] hover:opacity-90"
            >
              Get Started
            </a>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/70 bg-surface-container-lowest/90 text-on-surface md:hidden"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label="Toggle navigation"
          >
            <MaterialIcon
              name={mobileMenuOpen ? 'close' : 'menu'}
              className="text-[22px]"
            />
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.24 }}
              className="mx-auto mt-3 w-[calc(100%-1.5rem)] max-w-7xl rounded-[1.75rem] border border-outline-variant/70 bg-surface-container-lowest/92 p-4 shadow-ambient backdrop-blur-2xl md:hidden"
            >
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container-lowest/88 px-4 py-3 font-display text-base font-medium tracking-[-0.02em] text-on-surface transition hover:bg-surface-container-low"
                >
                  <MaterialIcon
                    name={isDarkTheme ? 'light_mode' : 'dark_mode'}
                    className="text-[20px]"
                  />
                  {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
                </button>
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="rounded-full px-4 py-3 font-display text-base font-medium tracking-[-0.02em] text-on-surface transition hover:bg-surface-container-low"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="#cta"
                  className="inline-flex items-center justify-center rounded-full border border-on-surface bg-on-surface px-6 py-3.5 font-display text-[0.95rem] font-medium tracking-[-0.01em] text-background transition hover:opacity-90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.header>

      <main id="top" className="relative z-10">
        <section className="mx-auto flex min-h-screen max-w-7xl items-center px-5 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-24 lg:pt-36">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div>
              <motion.p
                className="font-display text-sm font-medium uppercase tracking-[0.28em] text-primary"
                {...heroReveal(0.05)}
              >
                Calm money tracking
              </motion.p>
              <motion.h1
                className="mt-5 max-w-4xl font-display text-[2.8rem] font-medium leading-[0.96] tracking-[-0.06em] text-on-surface sm:text-[3.7rem] lg:text-[4.8rem]"
                {...heroReveal(0.12)}
              >
                Track spend clearly. Stay ahead.
              </motion.h1>
              <motion.p
                className="mt-5 max-w-xl text-base leading-7 text-on-surface-variant sm:text-[1.05rem]"
                {...heroReveal(0.2)}
              >
                Expenses, budgets, payment methods, and insights in one clean flow.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-col gap-3 sm:flex-row"
                {...heroReveal(0.28)}
              >
                <a
                  href="#cta"
                  className="inline-flex items-center justify-center rounded-full border border-on-surface bg-on-surface px-7 py-4 font-display text-base font-medium tracking-[-0.02em] text-background transition hover:scale-[1.02] hover:opacity-90"
                >
                  Get Started
                </a>
                <a
                  href="#product"
                  className="inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest/72 px-7 py-4 font-display text-base font-medium tracking-[-0.02em] text-on-surface transition hover:scale-[1.02] hover:bg-surface-container-lowest"
                >
                  Explore Product
                </a>
              </motion.div>
            </div>

            <motion.div
              className="relative mx-auto w-full max-w-[42rem]"
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={() => setHeroPointer({ x: 0, y: 0 })}
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute inset-x-10 top-10 h-48 rounded-full bg-primary/18 blur-3xl" />
              <div className="absolute inset-x-20 bottom-8 h-36 rounded-full bg-tertiary/14 blur-3xl" />

              <motion.div
                className="absolute -left-10 bottom-8 z-20 hidden rounded-[1.5rem] border border-white/60 bg-white/84 p-4 shadow-ambient backdrop-blur-xl sm:block"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Spend pace
                </p>
                <p className="mt-2 font-display text-2xl font-medium tracking-[-0.04em] text-on-surface">
                  +12%
                </p>
                <div className="mt-3 h-2.5 w-32 rounded-full bg-primary/10">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-8 top-3 z-20 hidden rounded-[1.5rem] border border-white/60 bg-white/84 p-4 shadow-ambient backdrop-blur-xl sm:block"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Smart alert
                </p>
                <p className="mt-2 text-sm font-semibold text-on-surface">
                  HDFC closes in 2 days
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Review travel + food before statement cut-off.
                </p>
              </motion.div>

              <motion.div
                className="relative rounded-[2.5rem] border border-white/60 bg-white/76 p-4 shadow-ambient backdrop-blur-2xl"
                animate={{
                  x: heroPointer.x * 10,
                  y: heroPointer.y * 10,
                  rotateX: heroPointer.y * -4,
                  rotateY: heroPointer.x * 5,
                }}
                transition={{ type: 'spring', stiffness: 110, damping: 18, mass: 0.8 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="overflow-hidden rounded-[2rem] border border-outline-variant/70 bg-[#111319] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                        Dashboard preview
                      </p>
                      <h2 className="mt-2 font-display text-[1.8rem] font-medium tracking-[-0.04em]">
                        Wallet snapshot
                      </h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/68">
                      Online
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[1.6rem] bg-white/6 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                        This month
                      </p>
                      <p className="mt-3 font-display text-[2.2rem] font-medium tracking-[-0.05em]">
                        Rs 28.4k
                      </p>
                      <p className="mt-2 text-sm text-white/62">
                        38% budget remaining across tracked categories.
                      </p>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/62">
                          <span>Food & Dining</span>
                          <span>Rs 8.9k</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-full w-[68%] rounded-full bg-[#4f55f1]" />
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/62">
                          <span>Groceries</span>
                          <span>Rs 5.7k</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-full w-[44%] rounded-full bg-[#00a87e]" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] bg-white/6 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">
                          Recent activity
                        </p>
                        <div className="rounded-full bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/62">
                          12 entries
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {heroTransactions.map((item) => (
                          <div
                            key={item.title}
                            className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/8 bg-white/5 px-3 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {item.title}
                              </p>
                              <p className="truncate text-xs text-white/54">
                                {item.meta}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-white">
                              {item.amount}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <motion.section
          id="features"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24"
          {...sectionReveal()}
        >
          <div className="max-w-3xl">
            <p className="font-display text-sm font-medium uppercase tracking-[0.28em] text-primary">
              Features
            </p>
            <h2 className="mt-4 font-display text-[2.2rem] font-medium leading-[1.02] tracking-[-0.05em] text-on-surface sm:text-[3rem]">
              Designed for better money habits
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
              Clear tracking, better reviews, less clutter.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {featureCards.map((feature, index) => (
              <motion.article
                key={feature.title}
                className={cn(
                  'group relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_80px_rgba(6,8,14,0.24)] backdrop-blur-xl',
                  feature.surface,
                  feature.span,
                )}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.65, delay: index * 0.06 }}
                whileHover={{ y: -8, rotateX: 3, rotateY: -3 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className={cn('absolute inset-0 opacity-80 transition duration-300 group-hover:opacity-100', feature.glow)} />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-70" />
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-[1.25rem]', feature.iconSurface)}>
                      <MaterialIcon name={feature.icon} className="text-[22px]" />
                    </div>
                  </div>

                  <h3 className="mt-5 font-display text-[1.5rem] font-medium tracking-[-0.04em] text-on-surface">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                    {feature.body}
                  </p>

                  <div className="mt-6">
                    <div className="h-2 rounded-full bg-surface-container-high">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${55 + index * 6}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: index * 0.05 }}
                      />
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-on-surface-variant">
                      {feature.note}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <section
          id="product"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start">
            <motion.div className="min-w-0 lg:sticky lg:top-32" {...sectionReveal()}>
              <p className="font-display text-sm font-medium uppercase tracking-[0.28em] text-primary">
                Product Showcase
              </p>
              <h2 className="mt-4 font-display text-[2.5rem] font-medium leading-[1.02] tracking-[-0.05em] text-on-surface sm:text-[3.4rem]">
                One interface for analytics, automation, insight, and trust.
              </h2>
              <div className="mt-10 flex flex-wrap gap-3">
                {showcaseTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'rounded-full border px-4 py-3 font-display text-sm font-medium tracking-[-0.02em] transition',
                      activeTab === tab.id
                        ? 'border-on-surface bg-on-surface text-background'
                        : 'border-outline-variant bg-surface-container-lowest/84 text-on-surface-variant hover:text-on-surface',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <ul className="mt-8 space-y-3">
                {activeShowcase.list.map((item, index) => (
                  <motion.li
                    key={item}
                    className="flex items-start gap-3 rounded-[1.4rem] border border-outline-variant/70 bg-surface-container-lowest/72 px-4 py-4"
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.36, delay: index * 0.06 }}
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <MaterialIcon name="done" className="text-[16px]" />
                    </div>
                    <span className="text-sm leading-7 text-on-surface-variant">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div className="min-w-0 lg:sticky lg:top-32" {...sectionReveal(0.08)}>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-outline-variant/70 bg-surface-container-lowest/88 p-6 shadow-ambient backdrop-blur-2xl sm:p-7">
                <div className={cn('absolute inset-0 bg-gradient-to-br', activeShowcase.accent)} />
                <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-white/30 blur-3xl" />
                <div className="relative">
                  <div className="relative min-h-[11rem] sm:min-h-[11.5rem]">
                    <div className="min-w-0 pr-24 sm:pr-36">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                        {activeShowcase.eyebrow}
                      </p>
                      <h3 className="mt-3 max-w-[44rem] font-display text-[2rem] font-medium leading-[1.04] tracking-[-0.04em] text-on-surface">
                        {activeShowcase.title}
                      </h3>
                      <p className="mt-4 max-w-[42rem] text-sm leading-7 text-on-surface-variant">
                        {activeShowcase.description}
                      </p>
                    </div>
                    <div className="absolute right-0 top-0 rounded-full border border-outline-variant/70 bg-surface-container-low px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                      Interactive
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeShowcase.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.28 }}
                      className="mt-8"
                    >
                      <ProductPreview activeTab={activeShowcase.id} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <motion.section
          id="cta"
          className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-28"
          {...sectionReveal()}
        >
          <div className="relative overflow-hidden rounded-[2.5rem] border border-outline-variant/70 bg-[#191c1f] px-6 py-8 text-white shadow-ambient sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,85,241,0.32),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(0,168,126,0.22),transparent_28%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
              <div>
                <h2 className="max-w-3xl font-display text-[2.3rem] font-medium leading-[1.02] tracking-[-0.05em] sm:text-[3rem]">
                  Start with a cleaner money flow.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/68">
                  Sign in with Google or continue as guest.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
                <div className="grid gap-3">
                  <Button
                    className="w-full gap-3 border-white bg-white text-[#191c1f] hover:bg-white/92"
                    onClick={() => void onGoogleSignIn()}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#4285F4]">
                      G
                    </span>
                    Continue with Google
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full gap-3 text-base"
                    onClick={() => void onContinueAsGuest()}
                  >
                    <MaterialIcon name="person" className="text-[20px]" />
                    Continue as Guest
                  </Button>
                </div>

                <a
                  href="#top"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-white/64 transition hover:text-white"
                >
                  <span className="nav-underline-link">Back to top</span>
                </a>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">
                      Private by default
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      Payment nicknames only
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">
                      Explore mode
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      Guest onboarding available
                    </p>
                  </div>
                </div>

                {bootstrapError ? (
                  <div className="mt-5 rounded-[1.4rem] border border-error/30 bg-error/10 px-4 py-3 text-sm text-white">
                    {bootstrapError}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
