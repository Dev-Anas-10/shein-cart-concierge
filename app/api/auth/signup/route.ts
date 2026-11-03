import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/lib/types';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth-security';
import { validateRealName, validateRealEmail } from '@/lib/input-validation';
import { validateEgyptianPhone, getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 4 signups per 2 minutes per IP to prevent spam bot accounts
    const rateCheck = checkRateLimit(`signup:${ip}`, { windowMs: 120_000, max: 4 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(
        rateCheck.retryAfterSec,
        `عفواً، تم إنشاء عدة حسابات مؤخراً. يرجى الانتظار لمدة ${rateCheck.retryAfterSec} ثانية قبل إنشاء حساب جديد.`
      );
    }

    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم، البريد الإلكتروني، وكلمة المرور مطلوبة.' },
        { status: 400 }
      );
    }

    // 1. Strict Name Legitimacy Validation (Anti-Gibberish / Full Name)
    const nameCheck = validateRealName(name);
    if (!nameCheck.isValid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    // 2. Strict Email Legitimacy Validation (Anti-Disposable / DNS MX check)
    const emailCheck = await validateRealEmail(email, { checkMx: true });
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    // 3. Optional Phone Validation if provided
    let cleanPhone = '';
    if (phone && phone.trim()) {
      const phoneCheck = validateEgyptianPhone(phone);
      if (!phoneCheck.isValid) {
        return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
      }
      cleanPhone = phoneCheck.phone;
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تتكون من 6 خانات على الأقل.' },
        { status: 400 }
      );
    }

    const existing = await db.getUserByEmail(emailCheck.email);
    if (existing) {
      return NextResponse.json(
        { error: 'يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني.' },
        { status: 409 }
      );
    }

    // Secure password hashing with bcrypt
    const hashedPassword = await hashPassword(password);
    const now = new Date().toISOString();

    const newUser: User & { password?: string } = {
      id: `user-${Date.now()}`,
      name: nameCheck.name,
      email: emailCheck.email,
      password: hashedPassword,
      phone: cleanPhone,
      role: 'user', // regular signups are always 'user'
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameCheck.name)}`,
      createdAt: now,
      lastLoginAt: now,
    };

    const saved = await db.createUser(newUser);
    const token = createSessionToken(saved);

    const res = NextResponse.json({ success: true, data: saved, token }, { status: 201 });
    setSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}
