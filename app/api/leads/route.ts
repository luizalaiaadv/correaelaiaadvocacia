import { NextResponse } from 'next/server';
import { fetchLeads } from '@/lib/typebot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leads = await fetchLeads();
    return NextResponse.json(
      { leads, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[api/leads]', error);
    return NextResponse.json(
      { error: 'Nao foi possivel carregar os leads do Typebot.' },
      { status: 502 },
    );
  }
}
