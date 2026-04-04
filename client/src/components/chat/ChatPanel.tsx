import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatChatTime } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';

const suggestions = [
  'This month summary',
  'Food expenses',
  'Top spending category',
  'I spent 450 on Zomato using HDFC Credit Card',
];

export function ChatPanel() {
  const { chatMessages, submitChatMessage } = useAppData();
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages]);

  async function handleSend(message: string) {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    setIsSending(true);
    setDraft('');
    await submitChatMessage(trimmed);
    setIsSending(false);
  }

  return (
    <div className="relative mx-auto flex min-h-[75vh] w-full max-w-4xl flex-col">
      <div
        ref={containerRef}
        className="no-scrollbar flex-1 space-y-8 overflow-y-auto pb-48"
      >
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <Card
              className={`max-w-[88%] rounded-[1.75rem] ${
                message.role === 'user'
                  ? 'rounded-tr-md bg-primary text-on-primary'
                  : 'rounded-tl-md bg-surface-container-low'
              }`}
            >
              <p className="whitespace-pre-wrap text-lg leading-8">
                {message.content}
              </p>
            </Card>
            <span className="mt-2 px-1 text-[10px] font-medium uppercase tracking-[0.24em] text-on-surface-variant">
              {message.role === 'user' ? 'You' : 'Assistant'} •{' '}
              {formatChatTime(message.timestamp)}
            </span>
          </div>
        ))}
      </div>

      <div className="glass-panel fixed bottom-24 left-0 right-0 z-20 px-4 pb-2 pt-4 lg:bottom-6 lg:left-72 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((item) => (
              <button
                key={item}
                onClick={() => void handleSend(item)}
                className="whitespace-nowrap rounded-full bg-secondary-container px-5 py-2 text-sm font-medium text-on-secondary-container transition hover:bg-surface-container-high"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-2 shadow-ambient">
            <button className="flex h-12 w-12 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-low">
              <MaterialIcon name="attach_file" />
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleSend(draft);
                }
              }}
              className="flex-1 border-none bg-transparent py-3 text-base text-on-surface outline-none placeholder:text-on-surface-variant/60"
              placeholder="Inquire about your ledger..."
            />
            <Button
              className="h-12 w-12 rounded-full p-0"
              onClick={() => void handleSend(draft)}
              disabled={isSending}
            >
              <MaterialIcon name="arrow_upward" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
