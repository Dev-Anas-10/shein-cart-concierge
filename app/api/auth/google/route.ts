import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/lib/types';
import { createSessionToken, setSessionCookie } from '@/lib/auth-security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.email || !body.email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid Gmail or Google email address' },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const name = body.name?.trim() || email.split('@')[0];
    const avatar =
      body.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    let user = await db.getUserByEmail(email);
    const now = new Date().toISOString();

    // Prevent privilege escalation / account takeover of administrator accounts
    if (user && user.role === 'admin') {
      return NextResponse.json(
        { error: 'Administrator accounts must authenticate using explicit password credentials.' },
        { status: 403 }
      );
    }

    if (!user) {
      // Create user if signing in with Google for the first time
      const newUser: User = {
        id: `google-${Date.now()}`,
        name,
        email,
        role: 'user',
        avatar,
        phone: body.phone || '01000000000',
        createdAt: now,
        lastLoginAt: now,
      };
      user = await db.createUser(newUser);
    } else {
      await db.recordUserLogin(user.id);
      user.lastLoginAt = now;
    }

    const { password, ...safeUser } = user;
    safeUser.lastLoginAt = user.lastLoginAt;
    safeUser.role = 'user'; // Social login can never grant elevated roles

    const token = createSessionToken(safeUser);
    const res = NextResponse.json({
      success: true,
      message: 'Logged in with Google successfully',
      data: safeUser,
      token,
    });

    setSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Google Auth failed' }, { status: 500 });
  }
}
