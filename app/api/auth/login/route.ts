import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = db.getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Role check if logging into admin specifically
    if (role === 'admin' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied: this account does not have Admin privileges.' },
        { status: 403 }
      );
    }

    if (user.password && user.password !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      data: safeUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
