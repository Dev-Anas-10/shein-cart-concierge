import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GoodItem, OrderStatus } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await db.getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await db.getOrderById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await req.json();

    const updates: any = {};

    // Status updates (approve, reject, processing, etc.)
    if (body.status) {
      updates.status = body.status as OrderStatus;
      if (body.status === 'APPROVED_PENDING_PAYMENT') {
        updates.reviewedBy = body.reviewedBy || 'Admin';
        updates.reviewedAt = new Date().toISOString();
        updates.pricingExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      }
      if (body.status === 'CANCELLED') {
        updates.cancelledAt = new Date().toISOString();
        updates.cancelledBy = body.cancelledBy || 'admin';
        updates.cancellationReason = body.cancellationReason || 'تم إلغاء الطلب من قبل الإدارة';
      }
    }

    // General order comment by admin
    if (body.adminComment !== undefined) {
      updates.adminComment = body.adminComment;
    }

    if (body.rejectionReason !== undefined) {
      updates.rejectionReason = body.rejectionReason;
    }

    // Shipment batch assignment
    if (body.shipmentId !== undefined) {
      updates.shipmentId = body.shipmentId ? String(body.shipmentId) : null;
      updates.shipmentCode = body.shipmentCode ? String(body.shipmentCode) : null;
    }

    // Dynamic fee adjustments
    if (typeof body.dynamicFeePercent === 'number') {
      updates.dynamicFeePercent = body.dynamicFeePercent;
    }

    if (typeof body.shippingFee === 'number') {
      updates.shippingFee = body.shippingFee;
    }

    if (body.pricingExpiresAt) {
      updates.pricingExpiresAt = body.pricingExpiresAt;
    }

    // Goods items review (price adjustment, individual comment for each good, status: approved / rejected)
    if (Array.isArray(body.items)) {
      const validatedItems: GoodItem[] = body.items.map((it: any) => ({
        ...it,
        status: it.status || 'available',
        quantity: Math.max(1, Number(it.quantity) || 1),
        originalPrice: Number(it.originalPrice) || 0,
        subtotal: (Math.max(1, Number(it.quantity) || 1)) * (Number(it.originalPrice) || 0),
        adminComment: it.adminComment || undefined,
      }));
      updates.items = validatedItems;
    }

    // Tracking updates from admin
    if (body.tracking) {
      updates.tracking = {
        ...(existing.tracking || {}),
        ...body.tracking,
      };
    }

    // Payment status update from admin
    if (body.paymentStatus && existing.payment) {
      if (body.paymentStatus === 'VERIFIED') {
        updates.status = 'PAID';
        updates.payment = {
          ...existing.payment,
          adminNote: body.adminPaymentNote || 'Payment confirmed by admin',
        };
        updates.tracking = {
          ...(existing.tracking || {}),
          currentStep: 1,
          history: [
            ...(existing.tracking?.history || []),
            {
              status: 'PAID',
              title: 'تم تأكيد الدفع بنجاح',
              description: 'تم التحقق من التحويل من قبل المشرف وبدء معالجة الطلب.',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      } else if (body.paymentStatus === 'REJECTED') {
        updates.status = 'APPROVED_PENDING_PAYMENT'; // reset so user can submit again
        updates.payment = {
          ...existing.payment,
          adminNote: body.adminPaymentNote || 'بيانات التحويل غير مطابقة أو لم تصل. يرجى التأكد وإعادة الإرسال.',
        };
      }
    }

    const updated = await db.updateOrder(id, updates);

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ok = await db.deleteOrder(id);
    if (!ok) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Order deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete order' }, { status: 500 });
  }
}
