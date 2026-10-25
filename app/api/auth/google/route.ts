import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || 'customer.google@gmail.com').trim().toLowerCase();
    const name = body.name || 'Google Customer';
    const avatar =
      body.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

    let user = db.getUserByEmail(email);

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
      user = db.createUser(newUser);
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
