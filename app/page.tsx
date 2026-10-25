'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExtractedCartResult, SystemSettings, Order } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useThemeLang } from '@/lib/theme-lang-context';
import { Navbar } from '@/components/Navbar';
import { CartExtractorCard } from '@/components/CartExtractorCard';
import { ExtractedGoodsView } from '@/components/ExtractedGoodsView';
import { AuthModal } from '@/components/AuthModal';
import { getClientOrders, mergeAndDeduplicateOrders } from '@/lib/order-storage';
import { SafeImage } from '@/components/SafeImage';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, dir } = useThemeLang();
  const [authOpen, setAuthOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedCartResult | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    // 1. Fetch system settings
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
      })
      .catch((err) => console.error(err));

    // 2. Fetch orders ONLY if logged in (strict privacy)
    if (!user) {
      setRecentOrders([]);
      return;
    }

    const clientSaved = getClientOrders(user.id, user.email);
    fetch(
      `/api/orders?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email || '')}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const merged = mergeAndDeduplicateOrders(data.data, clientSaved);
          setRecentOrders(merged.slice(0, 3));
        } else if (clientSaved.length > 0) {
          setRecentOrders(clientSaved.slice(0, 3));
        }
      })
      .catch(() => {
        if (clientSaved.length > 0) {
          setRecentOrders(clientSaved.slice(0, 3));
        }
      });
  }, [user]);

  const handleOrderCreated = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0c0a0f] text-neutral-900 dark:text-white pb-24 transition-colors">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {!extractedData ? (
          <>
            {/* Header Title */}
            <div className="text-center sm:text-start space-y-2 pt-2">
              <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                {t.heroBadge}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                {t.heroTitle}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xl">
                {t.heroSubtitle}
              </p>
            </div>

            {/* Main Extractor Card (Sample Cart removed) */}
            <CartExtractorCard
              onExtracted={(result) => setExtractedData(result)}
              currentDynamicFeePercent={settings?.dynamicFeePercent || 20}
            />

            {/* Latest Orders / Activity Section (Visible only when user is logged in) */}
            {user && recentOrders.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg">
                    {t.latestActivity}
                  </h3>
                  <Link
                    href="/orders"
                    className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
                  >
                    {t.seeAll}
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentOrders.map((ord) => (
                    <Link
                      key={ord.id}
                      href={`/orders/${ord.id}`}
                      className="bg-white dark:bg-[#14121a] rounded-3xl p-5 border border-neutral-100 dark:border-[#2a2538] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 overflow-hidden shrink-0 border border-neutral-100 dark:border-[#2a2538]">
                          {ord.items[0]?.image ? (
                            <SafeImage
                              src={ord.items[0].image}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-purple-400">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5 overflow-hidden">
                          <span className="font-mono font-black text-xs text-neutral-900 dark:text-white block group-hover:text-[#8B5CF6] transition-colors">
                            {ord.id}
                          </span>
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block truncate">
                            {ord.items.length} {t.goodsCount} • {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300">
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-50 dark:border-[#221e2d] flex items-center justify-between text-xs">
                        <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">
                          {t.totalCashLabel}
                        </span>
                        <span className="font-black text-neutral-900 dark:text-white">
                          {ord.totalCash.toLocaleString()} EGP
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Three Step Workflow (Clean, Minimalist, Bilingual) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white dark:bg-[#14121a] p-6 rounded-3xl border border-neutral-100 dark:border-[#2a2538] shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#F5EDFF] dark:bg-purple-950/40 text-[#8B5CF6] flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm">
                  {t.step1Title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {t.step1Desc}
                </p>
              </div>

              <div className="bg-white dark:bg-[#14121a] p-6 rounded-3xl border border-neutral-100 dark:border-[#2a2538] shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#F5EDFF] dark:bg-purple-950/40 text-[#8B5CF6] flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm">
                  {t.step2Title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {t.step2Desc}
                </p>
              </div>

              <div className="bg-white dark:bg-[#14121a] p-6 rounded-3xl border border-neutral-100 dark:border-[#2a2538] shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#F5EDFF] dark:bg-purple-950/40 text-[#8B5CF6] flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm">
                  {t.step3Title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {t.step3Desc}
                </p>
              </div>
            </div>
          </>
        ) : (
          <ExtractedGoodsView
            data={extractedData}
            onBack={() => setExtractedData(null)}
            onOrderCreated={handleOrderCreated}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
