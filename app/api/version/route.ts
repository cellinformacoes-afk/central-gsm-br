import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    version: "v2-ui-duration-badges",
    timestamp: "2026-03-22 23:53",
    status: "live"
  });
}
