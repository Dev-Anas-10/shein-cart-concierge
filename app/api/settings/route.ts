import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await db.updateSettings(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
