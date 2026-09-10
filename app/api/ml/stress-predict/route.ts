import { NextResponse } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:5001';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Forward to Flask microservice
    const upstream = await fetch(`${ML_SERVICE_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      // Short timeout so dashboard degrades gracefully
      signal:  AbortSignal.timeout(3000),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({ error: 'ML service error' }));
      return NextResponse.json({ stress_index: null, error: err.error }, { status: 502 });
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    // Flask offline or timeout — graceful fallback
    const msg = err instanceof Error ? err.message : 'ML service unavailable';
    return NextResponse.json(
      { stress_index: null, error: msg },
      { status: 503 }
    );
  }
}
