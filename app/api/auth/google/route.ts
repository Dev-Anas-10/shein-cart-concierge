import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/lib/types';

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

    if (!user) {
      // Create user if signing in with Google for the first time
      const newUser: User = {
        id: `google-${Date.now()}`,
        name,
        email,
        role: 'user',
        avatar,
        phone: body.phone || '01000000000',
        createdAt: new Date().toISOString(),
      };
      user = await db.createUser(newUser);
    }

    const { password, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      message: 'Logged in with Google successfully',
      data: safeUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Google Auth failed' }, { status: 500 });
  }
}
