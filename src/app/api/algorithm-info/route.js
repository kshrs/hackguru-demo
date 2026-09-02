import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    name: "HackGuru Next.js & Node.js AI Hybrid Engine",
    version: "2.0.0",
    features: [
      "In-Memory 384-dimensional Dense Semantic Vector Projection",
      "SIMD Dot Product RAM Vector Store",
      "Okapi BM25 Lexical Ranking with Inverted Index",
      "Normalized Levenshtein Typo Tolerance",
      "Conversational Entity Slot Intent Extractor",
      "Next.js React Server & Client Components"
    ]
  });
}
