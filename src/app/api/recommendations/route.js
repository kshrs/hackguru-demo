import { NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/recommendation';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const interestsParam = searchParams.get('interests') || searchParams.get('interest');
    const city = searchParams.get('city') || 'Coimbatore';
    const skillLevel = searchParams.get('skillLevel') || 'Beginner';
    const limit = searchParams.get('limit') || '8';
    const explore = searchParams.get('explore') !== 'false';

    const interests = interestsParam ? interestsParam.split(',').map(s => s.trim()) : ['AI / Machine Learning', 'Hackathons'];

    const result = getRecommendations({
      profile: {
        interests,
        city,
        skillLevel
      },
      limit: parseInt(limit, 10),
      exploreRate: explore ? 0.15 : 0.0
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Recommendations API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const profile = body.profile || {
      interests: body.interests || ['AI / Machine Learning', 'Hackathons'],
      city: body.city || 'Coimbatore',
      skillLevel: body.skillLevel || 'Beginner'
    };
    const sessionInteractions = body.sessionInteractions || [];
    const limit = body.limit || 8;

    const result = getRecommendations({
      profile,
      sessionInteractions,
      limit: parseInt(limit, 10)
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Recommendations POST API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
