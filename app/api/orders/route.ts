import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Order, GoodItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const orders = db.getOrders({ userId, status, search });
    return NextResponse.json({ success: true, data: orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      userId,
      userName,
      userEmail,
      userPhone,
      shippingAddress,
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

    const settings = db.getSettings();
    const feePercent = typeof dynamicFeePercent === 'number' ? dynamicFeePercent : (settings.dynamicFeePercent || 20);

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

    const orderId = `SH-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      userId: userId || 'guest-user',
      userName: userName || 'Customer',
      userEmail: userEmail || 'customer@example.com',
      userPhone: userPhone || '',
      shippingAddress: shippingAddress || '',
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
      status: 'PENDING_APPROVAL', // Starts as pending approval
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.createOrder(newOrder);

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (err: any) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
