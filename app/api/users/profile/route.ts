import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'userId or email is required' },
        { status: 400 }
      );
    }

    let user;
    if (userId) {
      user = await db.getUserById(userId);
    } else if (email) {
      user = await db.getUserByEmail(email);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { password, ...safeUser } = user;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, phone, address, city } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (typeof address === 'string') updates.address = address.trim();
    if (typeof city === 'string') updates.city = city.trim();

    const updatedUser = await db.updateUser(userId, updates);

    if (!updatedUser) {
      // If user was not found by ID, try looking up by email if provided
      if (body.email) {
        const existing = await db.getUserByEmail(body.email);
        if (existing) {
          const retried = await db.updateUser(existing.id, updates);
          if (retried) {
            return NextResponse.json({ success: true, data: retried });
          }
        }
      }
      return NextResponse.json(
        { error: 'User not found to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
