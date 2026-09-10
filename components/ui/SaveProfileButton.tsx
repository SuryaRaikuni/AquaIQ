'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark, Loader2, CheckCircle2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SaveProfileButtonProps {
  type:  'footprint' | 'irrigation';
  data:  object;
  className?: string;
}

type State = 'idle' | 'prompt' | 'saving' | 'saved' | 'error';

export function SaveProfileButton({ type, data, className }: SaveProfileButtonProps) {
  const { data: session } = useSession();
  const [state,  setState]  = useState<State>('idle');
  const [label,  setLabel]  = useState('');
  const [errMsg, setErrMsg] = useState('');

  // Guest: show sign-in nudge
  if (!session) {
    return (
      <Link
        href="/auth/login"
        className={cn(
          'inline-flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-2 hover:border-aqua-400 hover:text-aqua-600 transition-colors',
          className
        )}
      >
        <LogIn className="h-4 w-4" />
        Sign in to save this result
      </Link>
    );
  }

  async function save() {
    if (!label.trim()) return;
    setState('saving');
    try {
      const res = await fetch('/api/profiles', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, label: label.trim(), data }),
      });
      if (!res.ok) throw new Error('Save failed');
      setState('saved');
      setTimeout(() => setState('idle'), 3000);
      setLabel('');
    } catch {
      setErrMsg('Could not save. Please try again.');
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }

  if (state === 'saved') {
    return (
      <div className={cn('inline-flex items-center gap-2 text-sm text-green-600 font-medium', className)}>
        <CheckCircle2 className="h-4 w-4" />
        Saved to your profile!
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={cn('inline-flex items-center gap-2 text-sm text-destructive', className)}>
        {errMsg}
      </div>
    );
  }

  if (state === 'prompt' || state === 'saving') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Label for this result…"
          maxLength={60}
          className="border rounded-md px-3 py-1.5 text-sm bg-background flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-aqua-400"
        />
        <button
          onClick={save}
          disabled={!label.trim() || state === 'saving'}
          className="bg-aqua-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-aqua-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
        >
          {state === 'saving'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Bookmark className="h-3.5 w-3.5" />}
          {state === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => setState('idle')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Idle state
  return (
    <button
      onClick={() => setState('prompt')}
      className={cn(
        'inline-flex items-center gap-2 text-sm border border-border rounded-lg px-4 py-2 hover:border-aqua-400 hover:text-aqua-600 transition-colors',
        className
      )}
    >
      <Bookmark className="h-4 w-4" />
      Save this result
    </button>
  );
}
