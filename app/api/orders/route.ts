import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeOrderLinks } from '@/lib/shein-links';
import { Order, GoodItem } from '@/lib/types';
import { getRequestSession } from '@/lib/auth-security';
import {
  getClientIp,
  checkRateLimit,
  rateLimitResponse,
  validateEgyptianPhone,
} from '@/lib/rate-limit';
import { validateRealName, validateRealEmail } from '@/lib/input-validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const userEmail = searchParams.get('userEmail') || undefined;
    const userPhone = searchParams.get('userPhone') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const requestedAdmin = searchParams.get('admin') === 'true';
    const session = await getRequestSession(req);

    // If admin view is requested, strictly enforce administrator privileges
    if (requestedAdmin) {
      if (!session || session.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized: Administrator privileges required.' },
          {
            status: 401,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      }

      const orders = await db.getOrders({ userId, userEmail, userPhone, status, search });
      return NextResponse.json(
        { success: true, data: orders },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // Unauthenticated callers cannot enumerate customer orders
    if (!session) {
      return NextResponse.json(
        { success: true, data: [] },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // Authenticated admin can query with any custom filter
    if (session.role === 'admin') {
      const orders = await db.getOrders({ userId, userEmail, userPhone, status, search });
      return NextResponse.json(
        { success: true, data: orders },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // Authenticated customer: strictly bind query to their own authenticated identity
    const orders = await db.getOrders({
      userId: session.userId,
      userEmail: session.email,
      status,
      search,
    });

    return NextResponse.json(
      { success: true, data: orders },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // 1. IP Cooldown / Rate Limiting: max 2 orders per minute per IP
    const rateCheck = checkRateLimit(`create-order:${ip}`, { windowMs: 60_000, max: 2 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(
        rateCheck.retryAfterSec,
        `عفواً، قمت بإنشاء طلب منذ قليل. يرجى الانتظار لمدة ${rateCheck.retryAfterSec} ثانية قبل تقديم طلب جديد.`
      );
    }

    const body = await req.json();

    const {
      userId,
      userName,
      userEmail,
      userPhone,
      shippingAddress,
      customerNotes,
      notes,
      rawInput,
      extractedLink,
      cartShareCode,
      cartGroupId,
      cartCoverImage,
      items,
      dynamicFeePercent,
    } = body;

    if (!rawInput || !extractedLink || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must include extracted link and at least one good.' },
        { status: 400 }
      );
    }

    if (!userName || !userName.trim() || !userPhone || !userPhone.trim() || !shippingAddress || !shippingAddress.trim()) {
      return NextResponse.json(
        { error: 'Customer Name, Phone number, and Shipping Address are mandatory.' },
        { status: 400 }
      );
    }

    // 2. Strict Recipient Full Name Validation (Anti-Gibberish / Delivery courier compliance)
    const nameCheck = validateRealName(userName);
    if (!nameCheck.isValid) {
      return NextResponse.json(
        { error: nameCheck.error || 'يرجى كتابة الاسم ثنائياً بالكامل لاستكمال بوليصة الشحن.' },
        { status: 400 }
      );
    }

    // 3. Strict Egyptian Mobile Phone Validation
    const phoneCheck = validateEgyptianPhone(userPhone);
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { error: phoneCheck.error || 'يرجى إدخال رقم هاتف محمول مصري صحيح.' },
        { status: 400 }
      );
    }

    const session = await getRequestSession(req);
    const resolvedUserId = session?.userId || userId || 'guest-user';

    // 4. Strict Email Validation if provided
    let resolvedEmail = session?.email || '';
    if (!resolvedEmail && userEmail && userEmail.trim()) {
      const emailCheck = await validateRealEmail(userEmail, { checkMx: true });
      if (!emailCheck.isValid) {
        return NextResponse.json({ error: emailCheck.error }, { status: 400 });
      }
      resolvedEmail = emailCheck.email;
    }
    if (!resolvedEmail) {
      resolvedEmail = 'customer@example.com';
    }

    const resolvedName = nameCheck.name;

    // 5. Customer Unpaid / Pending Orders Cap & Duplicate Cart Protection
    // Retrieve existing orders to protect against spam / bulk throwing
    const allOrders = await db.getOrders({});
    const activeUnpaidOrders = allOrders.filter((o) => {
      const isSameUser = resolvedUserId !== 'guest-user' && o.userId === resolvedUserId;
      const isSameEmail = resolvedEmail && o.userEmail?.toLowerCase() === resolvedEmail.toLowerCase();
      const isSamePhone = o.userPhone && validateEgyptianPhone(o.userPhone).phone === phoneCheck.phone;
      const belongsToCustomer = isSameUser || isSameEmail || isSamePhone;

      const isUnpaidActive = ['PENDING_APPROVAL', 'APPROVED_PENDING_PAYMENT', 'PAYMENT_UNDER_REVIEW'].includes(o.status);
      return belongsToCustomer && isUnpaidActive;
    });

    // Check for duplicate pending cart
    if (cartGroupId || cartShareCode || extractedLink) {
      const duplicateOrder = activeUnpaidOrders.find((o) => {
        if (cartGroupId && o.cartGroupId === cartGroupId) return true;
        if (cartShareCode && o.cartShareCode === cartShareCode) return true;
        if (extractedLink && o.extractedLink === extractedLink) return true;
        return false;
      });

      if (duplicateOrder) {
        return NextResponse.json(
          {
            error: `هذه السلة مسجلة لديك بالفعل في الطلب رقم (#${duplicateOrder.id}) وحالتها الحالية هي (${duplicateOrder.status}). يمكنك متابعتها من صفحة طلباتي دون الحاجة لطلبها مرة أخرى.`,
            duplicateOrderId: duplicateOrder.id,
          },
          { status: 409 }
        );
      }
    }

    // Enforce maximum of 2 active unpaid orders per customer
    if (activeUnpaidOrders.length >= 2) {
      return NextResponse.json(
        {
          error: `عفواً، لديك بالفعل ${activeUnpaidOrders.length} طلبات معلقة قيد المراجعة أو في انتظار السداد (مثل طلب #${activeUnpaidOrders[0].id}). يرجى إتمام سداد طلبك السابق أو إلغاؤه من صفحة طلباتي قبل إنشاء طلب جديد.`,
          activeOrdersCount: activeUnpaidOrders.length,
        },
        { status: 400 }
      );
    }

    const settings = await db.getSettings();
    // Unified system-wide Service & Delivery Fee % from settings
    const feePercent = typeof settings.dynamicFeePercent === 'number' ? settings.dynamicFeePercent : 0;

    // Calculate totals accurately
    const itemsSubtotal = items.reduce((sum: number, it: GoodItem) => {
      const q = Math.max(1, it.quantity || 1);
      const p = it.originalPrice || 0;
      it.subtotal = q * p;
      return sum + it.subtotal;
    }, 0);

    const dynamicFeeAmount = Math.round(itemsSubtotal * (feePercent / 100));
    const shippingFee = settings.flatShippingFee || 0;
    const totalCash = itemsSubtotal + dynamicFeeAmount + shippingFee;

    const orderId = body.id || `SH-${Math.floor(10000 + Math.random() * 90000)}`;

    if (body.id) {
      const existing = await db.getOrderById(body.id);
      if (
        existing &&
        (existing.isPriceLocked ||
          existing.status !== 'PENDING_APPROVAL' ||
          existing.reviewedAt)
      ) {
        console.warn(`[POST /api/orders] Protected approved/locked order ${body.id} from recreation.`);
        return NextResponse.json({ success: true, data: existing }, { status: 200 });
      }
    }

    const newOrder: Order = normalizeOrderLinks({
      id: orderId,
      userId: resolvedUserId,
      userName: resolvedName,
      userEmail: resolvedEmail,
      userPhone: phoneCheck.phone,
      shippingAddress: shippingAddress.trim(),
      customerNotes: (customerNotes || notes || '').trim() || undefined,
      rawInput,
      extractedLink,
      cartShareCode,
      cartGroupId,
      cartCoverImage,
      items,
      itemsCount: items.length,
      itemsSubtotal,
      dynamicFeePercent: feePercent,
      dynamicFeeAmount,
      shippingFee,
      totalCash,
      currency: 'EGP',
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const created = await db.createOrder(newOrder);

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
