import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfDay,
  format,
  getDaysInMonth,
  parseISO,
  setDate,
  startOfDay,
  subMonths,
} from 'date-fns';

export interface BillingCycleRange {
  start: string;
  end: string;
  startDate: Date;
  endDate: Date;
  referenceMonth: string;
}

function clampBillingDay(baseDate: Date, billingCycleDay: number) {
  return Math.min(Math.max(billingCycleDay, 1), getDaysInMonth(baseDate));
}

function getCycleCloseForMonth(referenceMonth: string, billingCycleDay: number) {
  const monthDate = parseISO(`${referenceMonth}-01`);
  return endOfDay(setDate(monthDate, clampBillingDay(monthDate, billingCycleDay)));
}

export function getBillingCycleRangeForMonth(
  billingCycleDay: number,
  referenceMonth: string,
): BillingCycleRange {
  const endDate = getCycleCloseForMonth(referenceMonth, billingCycleDay);
  const previousMonth = format(subMonths(endDate, 1), 'yyyy-MM');
  const previousClose = getCycleCloseForMonth(previousMonth, billingCycleDay);
  const startDate = startOfDay(addDays(previousClose, 1));

  return {
    start: format(startDate, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd'),
    startDate,
    endDate,
    referenceMonth,
  };
}

export function getCurrentBillingCycleRange(
  billingCycleDay: number,
  referenceDate = new Date(),
) {
  const currentMonth = format(referenceDate, 'yyyy-MM');
  const currentMonthClose = getCycleCloseForMonth(currentMonth, billingCycleDay);
  const referenceMonth =
    referenceDate <= currentMonthClose
      ? currentMonth
      : format(addMonths(referenceDate, 1), 'yyyy-MM');

  return getBillingCycleRangeForMonth(billingCycleDay, referenceMonth);
}

export function getPreviousBillingCycleRange(
  billingCycleDay: number,
  referenceDate = new Date(),
) {
  const currentCycle = getCurrentBillingCycleRange(billingCycleDay, referenceDate);
  const previousMonth = format(
    subMonths(parseISO(`${currentCycle.referenceMonth}-01`), 1),
    'yyyy-MM',
  );

  return getBillingCycleRangeForMonth(billingCycleDay, previousMonth);
}

export function getNextBillingCycleCloseDate(
  billingCycleDay: number,
  referenceDate = new Date(),
) {
  return getCurrentBillingCycleRange(billingCycleDay, referenceDate).endDate;
}

export function getDaysUntilBillingCycleClose(
  billingCycleDay: number,
  referenceDate = new Date(),
) {
  const closeDate = getNextBillingCycleCloseDate(billingCycleDay, referenceDate);
  return differenceInCalendarDays(startOfDay(closeDate), startOfDay(referenceDate));
}

export function formatBillingCycleDayLabel(billingCycleDay: number) {
  const suffix =
    billingCycleDay % 10 === 1 && billingCycleDay % 100 !== 11
      ? 'st'
      : billingCycleDay % 10 === 2 && billingCycleDay % 100 !== 12
        ? 'nd'
        : billingCycleDay % 10 === 3 && billingCycleDay % 100 !== 13
          ? 'rd'
          : 'th';

  return `${billingCycleDay}${suffix}`;
}
