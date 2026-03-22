import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    version: "v2-debug-logo-extrato",
    timestamp: "2026-03-22 18:05",
    status: "live"
  });
}
