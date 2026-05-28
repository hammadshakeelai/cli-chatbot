import { NextRequest } from 'next/server';
import { getModels } from '@/providers/router';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return Response.json({ models: getModels() });
}
