import { NextResponse } from 'next/server';
import { getEventById, getAllEvents } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const event = getEventById(id);

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    // Related events
    const all = getAllEvents();
    const related = all.filter(e => e.id !== event.id && (e.category === event.category || e.location === event.location)).slice(0, 4);

    return NextResponse.json({
      success: true,
      event,
      related_events: related
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
