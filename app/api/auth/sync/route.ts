import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, setSessionCookie, getRequestSession } from '@/lib/auth-security';

export async function POST(req: NextRequest) {
  try {
    // Strictly require a valid HMAC-signed session cookie.
    // Never mint new session tokens based solely on unverified client JSON bodies.
    const existingSession = await getRequestSession(req);
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Unauthorized: No active or valid session found' },
        { status: 401 }
      );
    }

    // Refresh and return the verified session
    const user = await db.getUserById(existingSession.userId);
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const { password: _, ...safeUser } = user;
    const token = createSessionToken(safeUser);
    const res = NextResponse.json({
      success: true,
      data: safeUser,
      token,
    });

    setSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Session sync failed' }, { status: 500 });
  }
}
