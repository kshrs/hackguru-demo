import { NextResponse } from 'next/server';
import { registerEvent } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = body.userId || body.user_id || 'usr_kishor';
    const eventId = Number(body.eventId || body.event_id);
    const userName = body.name || 'Student';
    const userEmail = body.email || 'student@example.edu';
    const teamName = body.team || '';

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId required' }, { status: 400 });
    }

    registerEvent(userId, eventId, userName, userEmail, teamName);
    return NextResponse.json({ success: true, message: 'Registration confirmed', event_id: eventId });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
