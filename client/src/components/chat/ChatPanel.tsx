import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import {
  formatChatTime,
  formatCurrency,
  formatExpenseDate,
} from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';
import type { ChatMessage, ChatResponsePayload, Expense } from '@/types/domain';

const suggestions = [
  'How much did I spend this month?',
  'Show HDFC Credit Card expenses',
  'Which budgets are close to the limit?',
  'I spent 450 on Zomato using HDFC Credit Card',
];

function buildExpenseTitle(expense: Expense) {
  return expense.note || expense.merchant || expense.category;
}

function MessageAvatar({ role }: { role: ChatMessage['role'] }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
        role === 'assistant'
          ? 'bg-primary text-on-primary'
          : 'bg-surface-container-high text-on-surface'
      }`}
    >
      <MaterialIcon
        name={role === 'assistant' ? 'forum' : 'person'}
        filled={role === 'assistant'}
        className="text-[20px]"
      />
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-3">
      <MessageAvatar role="assistant" />
      <div className="rounded-[1.75rem] rounded-bl-md bg-surface-container-low px-5 py-4 shadow-ambient">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary/70 [animation-delay:0ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary/55 [animation-delay:160ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary/40 [animation-delay:320ms]" />
        </div>
      </div>
    </div>
  );
}

function AssistantResultCards({ payload }: { payload: ChatResponsePayload }) {
  const { settings } = useAppData();
  const matches = payload.matches ?? [];
  const total = matches.reduce((sum, expense) => sum + expense.amount, 0);
  const topCategory =
    Object.entries(
      matches.reduce<Record<string, number>>((accumulator, expense) => {
        accumulator[expense.category] =
          (accumulator[expense.category] || 0) + expense.amount;
        return accumulator;
      }, {}),
    ).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;

  return (
    <div className="mt-3 space-y-3">
      {payload.expense ? (
        <div className="rounded-[1.5rem] border border-primary/12 bg-surface-container-lowest p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Expense Saved
              </p>
              <h4 className="mt-2 text-base font-bold text-on-surface">
                {buildExpenseTitle(payload.expense)}
              </h4>
              <p className="mt-1 text-sm text-on-surface-variant">
                {payload.expense.category} • {payload.expense.paymentMethodName} •{' '}
                {formatExpenseDate(payload.expense.date)}
              </p>
            </div>
            <p className="text-sm font-black text-on-surface">
              {formatCurrency(payload.expense.amount, settings.currency)}
            </p>
          </div>
        </div>
      ) : null}

      {matches.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Matches
              </p>
              <p className="mt-2 text-lg font-black text-on-surface">
                {matches.length}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Total
              </p>
              <p className="mt-2 text-lg font-black text-on-surface">
                {formatCurrency(total, settings.currency)}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Top Category
              </p>
              <p className="mt-2 text-lg font-black text-on-surface">
                {topCategory ?? 'N/A'}
              </p>
            </div>
          </div>

          {!payload.expense ? (
            <div className="space-y-2">
              {matches.slice(0, 4).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-start justify-between gap-3 rounded-[1.25rem] bg-surface-container-lowest p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {buildExpenseTitle(expense)}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {expense.category} • {expense.paymentMethodName} •{' '}
                      {formatExpenseDate(expense.date)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-on-surface">
                    {formatCurrency(expense.amount, settings.currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {payload.budgetAlerts?.length ? (
        <div className="rounded-[1.5rem] border border-error/15 bg-error/5 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-error">
            Budget Alerts
          </p>
          <div className="mt-3 space-y-2">
            {payload.budgetAlerts.map((alert) => (
              <div
                key={alert.category}
                className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-surface-container-lowest/80 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {alert.category}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {formatCurrency(alert.spent, settings.currency)} of{' '}
                    {formatCurrency(alert.limit, settings.currency)}
                  </p>
                </div>
                <p className="text-sm font-black text-error">
                  {Math.round(alert.usage * 100)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyConversation({
  onPrompt,
}: {
  onPrompt: (prompt: string) => void;
}) {
  return (
    <div className="mx-auto flex min-h-[46vh] w-full max-w-3xl flex-col items-center justify-center px-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-primary text-on-primary shadow-ambient">
        <MaterialIcon name="forum" filled className="text-[26px]" />
      </div>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
        AI Assistant
      </p>
      <h1 className="mt-4 max-w-2xl text-[1.7rem] font-extrabold tracking-tight text-on-surface sm:text-3xl">
        Ask about spending or add an expense.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
        Try a quick summary, a budget check, or a message like "I spent 450 on
        Zomato".
      </p>

      <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
        {suggestions.map((item) => (
          <button
            key={item}
            onClick={() => onPrompt(item)}
            className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-lowest/90 px-4 py-3 text-left text-sm font-semibold text-on-surface shadow-ambient transition hover:-translate-y-0.5 hover:bg-surface-container-low"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { chatMessages, submitChatMessage } = useAppData();
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasConversation = useMemo(
    () => chatMessages.some((message) => message.role === 'user'),
    [chatMessages],
  );
  const conversationMessages = useMemo(() => {
    if (!hasConversation) {
      return [] as ChatMessage[];
    }

    return chatMessages.filter(
      (message, index) => !(index === 0 && message.role === 'assistant'),
    );
  }, [chatMessages, hasConversation]);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [conversationMessages, isSending]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [draft]);

  async function handleSend(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isSending) {
      return;
    }

    setIsSending(true);
    setDraft('');

    try {
      await submitChatMessage(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col">
      <div
        ref={containerRef}
        className="no-scrollbar flex-1 overflow-y-auto pb-52"
      >
        {!hasConversation ? (
          <EmptyConversation onPrompt={(item) => void handleSend(item)} />
        ) : (
          <div className="space-y-6 pt-2">
            {conversationMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' ? <MessageAvatar role="assistant" /> : null}

                <div
                  className={`max-w-[min(52rem,86vw)] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <Card
                    className={`${
                      message.role === 'user'
                        ? 'rounded-tr-md bg-primary text-on-primary'
                        : 'rounded-tl-md bg-surface-container-low'
                    } ${
                      message.status === 'error'
                        ? 'border border-error/20 bg-error/5 text-on-surface'
                        : ''
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-7 sm:text-base">
                      {message.content}
                    </p>
                  </Card>

                  {message.role === 'assistant' && message.payload ? (
                    <AssistantResultCards payload={message.payload} />
                  ) : null}

                  <span className="mt-2 block px-1 text-[10px] font-medium uppercase tracking-[0.24em] text-on-surface-variant">
                    {message.role === 'user' ? 'You' : 'Assistant'} •{' '}
                    {formatChatTime(message.timestamp)}
                  </span>
                </div>

                {message.role === 'user' ? <MessageAvatar role="user" /> : null}
              </div>
            ))}

            {isSending ? <TypingBubble /> : null}
          </div>
        )}
      </div>

      <div className="glass-panel fixed bottom-24 left-0 right-0 z-20 px-4 pb-2 pt-4 lg:bottom-6 lg:left-72 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-3 shadow-ambient">
            <div className="flex items-end gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
                <MaterialIcon name="edit_note" className="text-[22px]" />
              </div>

              <textarea
                ref={textareaRef}
                value={draft}
                rows={1}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend(draft);
                  }
                }}
                className="max-h-[180px] min-h-[52px] flex-1 resize-none border-none bg-transparent py-3 text-base leading-7 text-on-surface outline-none placeholder:text-on-surface-variant/60"
                placeholder="Message Wallet Wise about your spending..."
              />

              <Button
                className="h-12 w-12 shrink-0 rounded-full p-0"
                onClick={() => void handleSend(draft)}
                disabled={isSending || !draft.trim()}
                aria-label="Send message"
              >
                <MaterialIcon name="arrow_upward" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
