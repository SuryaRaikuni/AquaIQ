'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Droplets, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Registration failed');
      // Auto sign-in after registration
      await signIn('credentials', { email, password, redirect: false });
      router.push('/dashboard');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Droplets className="h-10 w-10 text-aqua-500 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your water footprint over time</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background"
              placeholder="Surya" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background"
              placeholder="Min. 8 characters" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-aqua-600 text-white py-2.5 rounded-lg font-semibold hover:bg-aqua-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-aqua-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
