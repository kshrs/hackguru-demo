import { NextResponse } from 'next/server';
import { getSearchEngine } from '@/lib/search';
import { getAllEvents } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || searchParams.get('searchText') || '';
    const category = searchParams.get('category') || searchParams.get('filter') || null;
    const mode = searchParams.get('mode') || null;
    const location = searchParams.get('location') || null;
    const price = searchParams.get('price') || null;
    const sort = searchParams.get('sort') || 'relevance';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const se = getSearchEngine();
    const result = se.search({ query: q, category, mode, location, price, sort, limit, offset });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
