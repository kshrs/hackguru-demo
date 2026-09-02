import { NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/recommendation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:5000';
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://127.0.0.1:8000';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'usr_kishor';
    const limit = searchParams.get('limit') || '8';
    const interestsParam = searchParams.get('interests') || searchParams.get('interest');
    const city = searchParams.get('city') || 'Coimbatore';
    const skillLevel = searchParams.get('skillLevel') || 'Beginner';
    const explore = searchParams.get('explore') !== 'false';

    // 1. Attempt fetching from Node.js Gateway (PostgreSQL + Redis + Python Engine)
    try {
      const gwRes = await fetch(`${GATEWAY_URL}/api/v1/recommendations?user_id=${encodeURIComponent(userId)}&limit=${limit}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        signal: AbortSignal.timeout(1200)
      });
      if (gwRes.ok) {
        const gwData = await gwRes.json();
        if (gwData && gwData.success && Array.isArray(gwData.recommendations) && gwData.recommendations.length > 0) {
          return NextResponse.json({
            ...gwData,
            source: 'nodejs_gateway_postgresql'
          });
        }
      }
    } catch (e) {
      // Gateway offline or timed out, attempt direct Python AI fallback
    }

    // 2. Attempt fetching directly from Python AI Engine (:8000)
    try {
      const pyRes = await fetch(`${PYTHON_AI_URL}/api/recommendations?user_id=${encodeURIComponent(userId)}&limit=${limit}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        signal: AbortSignal.timeout(1200)
      });
      if (pyRes.ok) {
        const pyData = await pyRes.json();
        if (pyData && pyData.success && Array.isArray(pyData.recommendations) && pyData.recommendations.length > 0) {
          return NextResponse.json({
            ...pyData,
            source: 'python_vector_engine'
          });
        }
      }
    } catch (e) {
      // Python AI offline, proceed to in-process Next.js recommendation model
    }

    // 3. Fallback to in-process Next.js semantic recommender
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

    return NextResponse.json({
      ...result,
      source: 'nextjs_in_process_fallback'
    });
  } catch (err) {
    console.error('Recommendations API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.user_id || 'usr_kishor';
    const limit = body.limit || 8;

    // 1. Try Node.js Gateway
    try {
      const gwRes = await fetch(`${GATEWAY_URL}/api/v1/recommendations?user_id=${encodeURIComponent(userId)}&limit=${limit}`, {
        method: 'GET',
        signal: AbortSignal.timeout(1200)
      });
      if (gwRes.ok) {
        const gwData = await gwRes.json();
        if (gwData && gwData.success && Array.isArray(gwData.recommendations)) {
          return NextResponse.json({
            ...gwData,
            source: 'nodejs_gateway_postgresql'
          });
        }
      }
    } catch (e) {}

    // 2. Fallback to in-process model
    const profile = body.profile || {
      interests: body.interests || ['AI / Machine Learning', 'Hackathons'],
      city: body.city || 'Coimbatore',
      skillLevel: body.skillLevel || 'Beginner'
    };
    const sessionInteractions = body.sessionInteractions || [];

    const result = getRecommendations({
      profile,
      sessionInteractions,
      limit: parseInt(limit, 10)
    });

    return NextResponse.json({
      ...result,
      source: 'nextjs_in_process_fallback'
    });
  } catch (err) {
    console.error('Recommendations POST API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
