import { NextResponse } from 'next/server';
import { toggleBookmark, getBookmarks } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'usr_kishor';
    const bookmarks = getBookmarks(userId);
    return NextResponse.json({ success: true, count: bookmarks.length, bookmarks });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = body.userId || body.user_id || 'usr_kishor';
    const eventId = Number(body.eventId || body.event_id);

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId required' }, { status: 400 });
    }

    const isBookmarked = toggleBookmark(userId, eventId);
    return NextResponse.json({ success: true, is_bookmarked: isBookmarked, event_id: eventId });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
