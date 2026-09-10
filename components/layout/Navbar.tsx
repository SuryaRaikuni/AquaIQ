'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Droplets, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/dashboard',  label: 'Dashboard'    },
  { href: '/calculator', label: 'Footprint'     },
  { href: '/irrigation', label: 'Irrigation'    },
  { href: '/legal',      label: 'Legal'         },
  { href: '/simulator',  label: 'Simulator'     },
  { href: '/profile',    label: 'My Profile'    },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-aqua-700">
          <Droplets className="h-6 w-6 text-aqua-500" />
          AquaIQ
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname.startsWith(l.href)
                  ? 'bg-aqua-100 text-aqua-700'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-muted-foreground">{session.user?.name ?? session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-aqua-600 hover:underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm bg-aqua-600 text-white px-4 py-1.5 rounded-md hover:bg-aqua-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-background px-4 py-3 flex flex-col gap-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium',
                pathname.startsWith(l.href)
                  ? 'bg-aqua-100 text-aqua-700'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <button onClick={() => signOut()} className="text-left text-sm text-aqua-600 px-3 py-2">
              Sign out
            </button>
          ) : (
            <Link href="/auth/login" onClick={() => setOpen(false)} className="text-sm text-aqua-600 px-3 py-2">
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
