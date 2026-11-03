import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

// In-process sliding window rate limit cache
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic memory cleanup every 3 minutes
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 300_000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 180_000);

  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

/**
 * Extracts real client IP address across standard and Cloudflare/Vercel proxy headers
 */
export function getClientIp(req: NextRequest): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim();
  }

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor && xForwardedFor.trim()) {
    const first = xForwardedFor.split(',')[0].trim();
    if (first) return first;
  }

  return '127.0.0.1';
}

/**
 * Evaluates sliding-window rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60_000, max: 10 }
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps outside current window
  record.timestamps = record.timestamps.filter((t) => now - t < options.windowMs);

  if (record.timestamps.length >= options.max) {
    const oldest = record.timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: options.max - record.timestamps.length,
    retryAfterSec: 0,
  };
}

/**
 * Standard 429 Too Many Requests response
 */
export function rateLimitResponse(retryAfterSec: number, customMessage?: string): NextResponse {
  return NextResponse.json(
    {
      error:
        customMessage ||
        `عفواً، تم إرسال عدد كبير من الطلبات في وقت قصير. يرجى الانتظار لمدة ${retryAfterSec} ثانية ثم المحاولة مجدداً.`,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

/**
 * Validates and normalizes Egyptian mobile phone numbers
 */
export function validateEgyptianPhone(rawPhone?: string): {
  isValid: boolean;
  phone: string;
  error?: string;
} {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, phone: '', error: 'رقم الهاتف مطلوب.' };
  }

  // Remove non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  // Handle international prefix (+20 or 0020 or 20)
  if (digits.startsWith('0020')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = digits.slice(2);
  }

  // If user entered 10 digits without leading 0 (e.g. 1012345678), add leading 0
  if (digits.length === 10 && (digits.startsWith('10') || digits.startsWith('11') || digits.startsWith('12') || digits.startsWith('15'))) {
    digits = '0' + digits;
  }

  // Must match Egyptian mobile network standard (11 digits starting with 010, 011, 012, 015)
  const egMobileRegex = /^01[0125][0-9]{8}$/;
  if (!egMobileRegex.test(digits)) {
    return {
      isValid: false,
      phone: digits,
      error: 'يرجى إدخال رقم هاتف محمول مصري صحيح مكون من 11 رقماً يبدأ بـ (010 أو 011 أو 012 أو 015).',
    };
  }

  // Reject obvious dummy/repetitive numbers (e.g. 01000000000, 01111111111)
  const lastEight = digits.slice(3);
  if (/^(\d)\1{7}$/.test(lastEight)) {
    return {
      isValid: false,
      phone: digits,
      error: 'يرجى إدخال رقم هاتف حقيقي لتأكيد الشحن والتواصل مع المندوب.',
    };
  }

  return { isValid: true, phone: digits };
}
