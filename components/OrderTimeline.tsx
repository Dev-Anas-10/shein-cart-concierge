'use client';

import React from 'react';
import { OrderStatus } from '@/lib/types';
import { Check, Clock, AlertTriangle, ShieldCheck, CreditCard, PackageCheck, XCircle } from 'lucide-react';

interface OrderTimelineProps {
  status: OrderStatus;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  if (status === 'REJECTED') {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-center gap-3.5 text-rose-900 text-xs shadow-xs">
        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <p className="font-black text-rose-950">Order Rejected by Admin</p>
          <p className="text-[11px] text-rose-700 mt-0.5">
            This order has been declined. Please check the admin comment below or extract a new cart.
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      key: 'SUBMITTED',
      label: 'Cart Submitted',
      desc: 'Link parsed & saved',
      isCompleted: true,
      isCurrent: false,
    },
    {
      key: 'APPROVAL',
      label: 'Admin Review',
      desc: status === 'PENDING_APPROVAL' ? 'Items under review' : 'Approved',
      isCompleted: ['APPROVED_PENDING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(status),
      isCurrent: status === 'PENDING_APPROVAL',
    },
    {
      key: 'PAYMENT',
      label: 'Payment',
      desc: status === 'APPROVED_PENDING_PAYMENT' ? 'InstaPay / VF Cash' : 'Settled',
      isCompleted: ['PAYMENT_UNDER_REVIEW', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(status),
      isCurrent: status === 'APPROVED_PENDING_PAYMENT',
    },
    {
      key: 'VERIFY',
      label: 'Verification',
      desc: status === 'PAYMENT_UNDER_REVIEW' ? 'Receipt under check' : 'Verified',
      isCompleted: ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(status),
      isCurrent: status === 'PAYMENT_UNDER_REVIEW',
    },
    {
      key: 'PURCHASE',
      label: 'Fulfillment',
      desc: 'Purchased on SHEIN',
      isCompleted: ['COMPLETED'].includes(status),
      isCurrent: ['PAID', 'PROCESSING', 'SHIPPED'].includes(status),
    },
  ];

  return (
    <div className="py-2">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {steps.map((step, idx) => (
          <div
            key={step.key}
            className={`p-3.5 rounded-2xl border transition-all duration-200 ${
              step.isCurrent
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 shadow-sm'
                : step.isCompleted
                ? 'bg-emerald-50/70 border-emerald-200/80'
                : 'bg-neutral-50/50 border-neutral-200/70 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                  step.isCurrent
                    ? 'bg-amber-500 text-white animate-pulse'
                    : step.isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {step.isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className="text-xs font-black text-neutral-900 truncate">{step.label}</span>
            </div>
            <p className="text-[11px] text-neutral-500 pl-8 truncate font-medium">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
