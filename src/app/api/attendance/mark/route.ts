import { NextRequest, NextResponse } from 'next/server';
import { POST as validatePost } from '../validate/route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return validatePost(request);
}
