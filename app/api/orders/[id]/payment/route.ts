import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentDetails } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await db.getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'APPROVED_PENDING_PAYMENT') {
      return NextResponse.json(
        { error: `Payment cannot be submitted while order status is ${order.status}` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { method, senderIdentifier, transactionReference, receiptImage } = body;

    if (!method || !['instapay', 'vodafone_cash'].includes(method)) {
      return NextResponse.json(
        { error: 'Valid payment method (instapay or vodafone_cash) is required.' },
        { status: 400 }
      );
    }

    if (!senderIdentifier || typeof senderIdentifier !== 'string') {
      return NextResponse.json(
        { error: 'Please provide your sender phone number or InstaPay address.' },
        { status: 400 }
      );
    }

    const payment: PaymentDetails = {
      method,
      senderIdentifier: senderIdentifier.trim(),
      transactionReference: transactionReference?.trim() || undefined,
      receiptImage: receiptImage || undefined,
      submittedAt: new Date().toISOString(),
    };

    const updated = await db.updateOrder(id, {
      payment,
      status: 'PAYMENT_UNDER_REVIEW',
    });

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully and is now under review.',
      data: updated,
    });
  } catch (err: any) {
    console.error('Submit payment error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit payment details' },
      { status: 500 }
    );
  }
}
