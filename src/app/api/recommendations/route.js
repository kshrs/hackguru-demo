import { NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/db';

export async function GET(request) {
  try {
    const all = getAllEvents();
    const featured = all.filter(e => e.is_featured).slice(0, 6);
    const trending = all.slice(0, 8);

    return NextResponse.json({
      success: true,
      algorithm: 'hybrid_semantic_feed',
      recommendations: featured.length > 0 ? featured : trending
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
