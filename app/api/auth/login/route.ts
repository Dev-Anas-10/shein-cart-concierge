import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth-security';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.getUserByEmail(email);

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

    // Secure password verification with bcrypt
    const { isValid, needsRehash } = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Transparently upgrade legacy plain-text password to salted bcrypt hash
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await db.updateUser(user.id, { password: newHash });
    }

    // Record last login timestamp in database
    const lastLoginAt = await db.recordUserLogin(user.id);

    const { password: _, ...safeUser } = user;
    safeUser.lastLoginAt = lastLoginAt;

    return NextResponse.json({
      success: true,
      data: safeUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
