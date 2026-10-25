import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const users = await db.getUsers();
    // Strip passwords before returning
    const safeUsers = users.map(({ password, ...u }) => u);
    return NextResponse.json({ success: true, data: safeUsers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
