import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, ImagePlus, Send, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  user_id: string;
  full_name: string | null;
  text: string;
  sent_at: string;       // ISO string
  reactions?: { emoji: string; count: number }[];
  is_system?: boolean;   // e.g. "X just woke up!" notifications
}

interface Props {
  groupName: string;
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${ampm} ${String(h % 12 || 12).padStart(2,'0')}:${m}`;
}

function fmtDateSep(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function shouldShowDateSep(prev: ChatMessage | undefined, curr: ChatMessage): boolean {
  if (!prev) return true;
  const a = new Date(prev.sent_at).toDateString();
  const b = new Date(curr.sent_at).toDateString();
  return a !== b;
}

// ── System message (wake notification) ────────────────────────────────────

function SystemMsg({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-center py-1">
      <div className="flex items-center gap-1.5 rounded-full bg-[#0f1f2e] border border-[#1e3a5a] px-3 py-1 text-xs text-[#7dd3fc]">
        <Bell className="h-3 w-3" />
        {msg.text}
      </div>
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────

function ChatBubble({
  msg,
  isMe,
  showAvatar,
  onReact,
}: {
  msg: ChatMessage;
  isMe: boolean;
  showAvatar: boolean;
  onReact?: (emoji: string) => void;
}) {
  const initials = (msg.full_name || '?').slice(0, 2).toUpperCase();

  return (
    <div className={cn('flex items-end gap-2', isMe && 'flex-row-reverse')}>
      {/* avatar */}
      <div className="h-7 w-7 shrink-0">
        {showAvatar && !isMe ? (
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] bg-[#1e1e30] text-[#8080b0]">
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-7 w-7" />
        )}
      </div>

      <div className={cn('flex max-w-[70%] flex-col gap-0.5', isMe && 'items-end')}>
        {/* sender name (only for others, first bubble in group) */}
        {showAvatar && !isMe && (
          <span className="px-1 text-[10px] text-[#5a5a7a]">{msg.full_name || 'Member'}</span>
        )}

        {/* bubble */}
        <div className={cn(
          'rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isMe
            ? 'rounded-br-sm bg-[#1e5a8e] text-white'
            : 'rounded-bl-sm bg-[#1a1a2a] border border-[#2a2a3a] text-[#e0e0f0]',
        )}>
          {msg.text}
        </div>

        {/* time + reactions */}
        <div className={cn('flex items-center gap-1.5', isMe && 'flex-row-reverse')}>
          <span className="text-[10px] text-[#3a3a5a]">{fmtTime(msg.sent_at)}</span>
          {msg.reactions?.map(r => (
            <button
              key={r.emoji}
              onClick={() => onReact?.(r.emoji)}
              className="flex items-center gap-0.5 rounded-full bg-[#1e1e2e] border border-[#2a2a3a] px-1.5 py-0.5 text-xs hover:bg-[#2a2a3e] transition-colors"
            >
              {r.emoji}<span className="text-[#8080b0]">{r.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export function GroupWakeChat({ groupName, messages, currentUserId, onSend, onReact }: Props) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col bg-[#080810] h-full">

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5 scrollbar-none">
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const isMe = msg.user_id === currentUserId;
          const prevSameUser = prev && prev.user_id === msg.user_id && !prev.is_system;
          const showAvatar = !prevSameUser;
          const showDate = shouldShowDateSep(prev, msg);

          return (
            <div key={msg.id}>
              {/* date separator */}
              {showDate && (
                <div className="flex items-center gap-2 py-3">
                  <div className="flex-1 h-px bg-[#1e1e2e]" />
                  <span className="text-xs text-[#3a3a5a] shrink-0">{fmtDateSep(msg.sent_at)}</span>
                  <div className="flex-1 h-px bg-[#1e1e2e]" />
                </div>
              )}

              {msg.is_system ? (
                <SystemMsg msg={msg} />
              ) : (
                <ChatBubble
                  msg={msg}
                  isMe={isMe}
                  showAvatar={showAvatar}
                  onReact={(emoji) => onReact?.(msg.id, emoji)}
                />
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-[#1a1a2a] bg-[#0d0d16] px-3 py-2.5 flex items-end gap-2">
        <button className="text-[#3a3a5a] hover:text-[#7dd3fc] transition-colors p-1 shrink-0">
          <ImagePlus className="h-5 w-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            className="w-full resize-none rounded-2xl bg-[#1a1a2a] border border-[#2a2a3a] px-3 py-2 text-sm text-white placeholder-[#3a3a5a] focus:outline-none focus:border-[#2dd4bf] transition-colors min-h-[38px] max-h-32 scrollbar-none"
            placeholder="Message..."
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
        </div>

        <button className="text-[#3a3a5a] hover:text-[#7dd3fc] transition-colors p-1 shrink-0">
          <Smile className="h-5 w-5" />
        </button>

        <Button
          size="icon"
          className="h-9 w-9 rounded-full bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#080810] shrink-0 transition-all"
          onClick={handleSend}
          disabled={!draft.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
