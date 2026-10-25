'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExtractedCartResult, SystemSettings } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { CartExtractorCard } from '@/components/CartExtractorCard';
import { ExtractedGoodsView } from '@/components/ExtractedGoodsView';
import { AuthModal } from '@/components/AuthModal';
import {
  Sparkles,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Percent,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Zap,
  Lock,
  Clock,
  Compass,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedCartResult | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleOrderCreated = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 pb-24">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Luxury Hero Banner */}
        {!extractedData && (
          <div className="text-center max-w-3xl mx-auto space-y-5 pt-6 sm:pt-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-spin" />
              <span>Official SHEIN Egypt Cart Concierge & Settlement Hub</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-neutral-950 tracking-tight leading-[1.1]">
              Extract Any SHEIN Cart.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-red-600 to-amber-600">
                Pay with InstaPay & Vodafone Cash.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto leading-relaxed font-normal">
              Share your cart directly from the SHEIN app. Our parser cleans the text, extracts every good, calculates transparent dynamic 20% concierge fees, submits for admin approval, and unlocks local Egyptian payments.
            </p>

            {/* Quick Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-neutral-500">
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Live SHEIN Parser
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-xs">
                <Percent className="w-3.5 h-3.5 text-rose-600" />
                +20% Dynamic Service Fee
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-xs">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                InstaPay & Vodafone Cash
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Admin Accurate Review
              </span>
            </div>
          </div>
        )}

        {/* Main Extractor Card or Extracted Goods Lookbook View */}
        {!extractedData ? (
          <div className="max-w-4xl mx-auto space-y-12">
            <CartExtractorCard
              onExtracted={(result) => setExtractedData(result)}
              currentDynamicFeePercent={settings?.dynamicFeePercent || 20}
            />

            {/* Editorial Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-7 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-lg transition-shadow space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  1
                </div>
                <h4 className="font-black text-neutral-950 text-lg">Paste Any Context</h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-normal">
                  Even if users send the entire share caption from SHEIN, our engine isolates the exact <code className="font-mono text-neutral-900 bg-neutral-100 px-1 py-0.5 rounded">onelink.shein.com</code> URL and extracts every good.
                </p>
              </div>

              <div className="bg-white p-7 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-lg transition-shadow space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  2
                </div>
                <h4 className="font-black text-neutral-950 text-lg">Admin Review & Comments</h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-normal">
                  Orders start in <strong className="text-amber-700">Pending Approval</strong>. The admin reviews items accurately, adds comments per good, and adjusts pricing before unlocking payment.
                </p>
              </div>

              <div className="bg-white p-7 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-lg transition-shadow space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-rose-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  3
                </div>
                <h4 className="font-black text-neutral-950 text-lg">Direct Local Settlements</h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-normal">
                  Once approved, pay using your preferred Egyptian account: <strong className="text-neutral-900">InstaPay (IPA)</strong> or <strong className="text-neutral-900">Vodafone Cash (*9*7*...#)</strong> with proof verification.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ExtractedGoodsView
            data={extractedData}
            onOrderCreated={handleOrderCreated}
            onReset={() => setExtractedData(null)}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
