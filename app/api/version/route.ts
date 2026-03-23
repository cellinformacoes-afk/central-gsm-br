import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    version: "v2-ui-duration-badges-v3",
    timestamp: "2026-03-23 00:09",
    status: "live"
  });
}
