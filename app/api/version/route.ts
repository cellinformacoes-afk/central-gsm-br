import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    version: "v2-robust-webhook",
    timestamp: "2026-03-22 22:15",
    status: "live"
  });
}
