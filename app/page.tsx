'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ExtractedCartResult, SystemSettings, Order } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useThemeLang } from '@/lib/theme-lang-context';
import { Navbar } from '@/components/Navbar';
import { CartExtractorCard } from '@/components/CartExtractorCard';
import { ExtractedGoodsView } from '@/components/ExtractedGoodsView';
import { AuthModal } from '@/components/AuthModal';
import { FullPageLoginCard } from '@/components/FullPageLoginCard';
import { CustomSectionRenderer } from '@/components/CustomSectionRenderer';
import { getClientOrders, mergeAndDeduplicateOrders } from '@/lib/order-storage';
import { SafeImage } from '@/components/SafeImage';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { t, dir } = useThemeLang();
  const [guestMode, setGuestMode] = useState(false);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0713] flex items-center justify-center">
        <div className="w-9 h-9 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !guestMode) {
    return <FullPageLoginCard onGuestContinue={() => setGuestMode(true)} />;
  }

  const topSections = settings?.customSections?.filter((s) => s.enabled && s.position === 'top') || [];
  const middleSections = settings?.customSections?.filter((s) => s.enabled && s.position === 'middle') || [];
  const bottomSections = settings?.customSections?.filter((s) => s.enabled && s.position === 'bottom') || [];

  return (
    <div className="min-h-screen bg-[#FBFBFC] dark:bg-[#0c0a0f] text-neutral-900 dark:text-white pb-24 transition-colors relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-b from-purple-400/8 via-pink-400/4 to-transparent dark:from-purple-600/10 dark:via-purple-900/5 dark:to-transparent pointer-events-none blur-3xl -z-10" />

      {/* Optional Top Announcement Bar Configured by Admin */}
      {settings?.announcementEnabled !== false && settings?.announcementText && (
        <div
          className={`w-full py-2.5 px-4 text-center text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-2 ${
            settings?.announcementBg === 'amber'
              ? 'bg-amber-400 text-amber-950'
              : settings?.announcementBg === 'emerald'
              ? 'bg-emerald-600 text-white'
              : settings?.announcementBg === 'rose'
              ? 'bg-rose-600 text-white'
              : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-90" />
          <span>{settings.announcementText}</span>
        </div>
      )}

      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {!extractedData ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-10"
          >
            {/* Header Title with Animated Stagger */}
            <motion.div variants={itemVariants} className="text-center sm:text-start space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-[#7C3AED] dark:text-purple-300 text-xs font-black uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>{settings?.heroBadge || t.heroBadge}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-950 dark:text-white tracking-tight leading-tight">
                {settings?.heroTitle || t.heroTitle}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
                {settings?.heroSubtitle || t.heroSubtitle}
              </p>
            </motion.div>

            {/* Custom Sections: Top Position */}
            {topSections.map((sec) => (
              <motion.div key={sec.id} variants={itemVariants}>
                <CustomSectionRenderer section={sec} dir={dir} />
              </motion.div>
            ))}

            {/* Main Extractor Card with Liquid Glass & Motion */}
            <motion.div variants={itemVariants}>
              <CartExtractorCard
                onExtracted={(result) => setExtractedData(result)}
                currentDynamicFeePercent={settings?.dynamicFeePercent || 20}
              />
            </motion.div>

            {/* Trust Metrics Bar (Can be toggled by Admin) */}
            {settings?.trustMetricsEnabled !== false && (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2"
              >
                <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#14111d]/70 backdrop-blur-md border border-neutral-200/60 dark:border-[#2a243a] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 text-[#8B5CF6] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-neutral-900 dark:text-white leading-tight">
                      {settings?.enableInstapay ? 'InstaPay & Wallets' : 'Mobile Wallets'}
                    </h4>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{dir === 'rtl' ? 'دفع بالجنيه المصري' : 'Pay in Egyptian EGP'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#14111d]/70 backdrop-blur-md border border-neutral-200/60 dark:border-[#2a243a] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-neutral-900 dark:text-white leading-tight">{dir === 'rtl' ? 'فحص ومراجعة دقيقة' : 'Supervisor Verified'}</h4>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{dir === 'rtl' ? 'ضمان توافر المقاسات' : 'Inventory & size check'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#14111d]/70 backdrop-blur-md border border-neutral-200/60 dark:border-[#2a243a] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-neutral-900 dark:text-white leading-tight">{dir === 'rtl' ? 'توصيل لباب بيتك' : 'Doorstep Delivery'}</h4>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{dir === 'rtl' ? 'كل محافظات مصر' : 'Across all Egypt'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#14111d]/70 backdrop-blur-md border border-neutral-200/60 dark:border-[#2a243a] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-neutral-900 dark:text-white leading-tight">{dir === 'rtl' ? 'خصوصية كاملة' : '100% Privacy'}</h4>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{dir === 'rtl' ? 'طلباتك محمية وموثقة' : 'Strict user data security'}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Custom Sections: Middle Position */}
            {middleSections.map((sec) => (
              <motion.div key={sec.id} variants={itemVariants}>
                <CustomSectionRenderer section={sec} dir={dir} />
              </motion.div>
            ))}

            {/* Latest Orders / Activity Section (Visible only when user is logged in) */}
            {user && recentOrders.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-black text-neutral-900 dark:text-white text-lg">
                    {t.latestActivity}
                  </h3>
                  <Link
                    href="/orders"
                    className="text-xs font-black text-[#8B5CF6] hover:text-[#7C3AED] transition-colors flex items-center gap-1 group"
                  >
                    <span>{t.seeAll}</span>
                    {dir === 'rtl' ? (
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentOrders.map((ord) => (
                    <motion.div
                      key={ord.id}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href={`/orders/${ord.id}`}
                        className="bg-white/90 dark:bg-[#14111d]/90 backdrop-blur-md rounded-3xl p-5 border border-neutral-200/70 dark:border-[#2a243a] shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between gap-4 group h-full"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 overflow-hidden shrink-0 border border-neutral-100 dark:border-[#2a243a]">
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

                        <div className="pt-2 border-t border-neutral-100 dark:border-[#221c2d] flex items-center justify-between text-xs">
                          <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">
                            {t.totalCashLabel}
                          </span>
                          <span className="font-black text-neutral-900 dark:text-white">
                            {ord.totalCash.toLocaleString()} EGP
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Three Step Workflow with Spring Hover (Can be toggled or customized by Admin) */}
            {settings?.howItWorksEnabled !== false && (
              <motion.div variants={itemVariants} className="space-y-3 pt-2">
                <h3 className="font-black text-neutral-900 dark:text-white text-lg px-1">
                  {dir === 'rtl' ? 'كيف تعمل خدمة SHEIN Concierge؟' : 'How SHEIN Concierge Works'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white/90 dark:bg-[#14111d]/90 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/70 dark:border-[#2a243a] shadow-xs space-y-3"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#C084FC] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-purple-500/20">
                      1
                    </div>
                    <h4 className="font-black text-neutral-900 dark:text-white text-sm">
                      {settings?.step1Title || t.step1Title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {settings?.step1Desc || t.step1Desc}
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white/90 dark:bg-[#14111d]/90 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/70 dark:border-[#2a243a] shadow-xs space-y-3"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#C084FC] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-purple-500/20">
                      2
                    </div>
                    <h4 className="font-black text-neutral-900 dark:text-white text-sm">
                      {settings?.step2Title || t.step2Title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {settings?.step2Desc || t.step2Desc}
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white/90 dark:bg-[#14111d]/90 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/70 dark:border-[#2a243a] shadow-xs space-y-3"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#C084FC] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-purple-500/20">
                      3
                    </div>
                    <h4 className="font-black text-neutral-900 dark:text-white text-sm">
                      {settings?.step3Title || t.step3Title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {settings?.step3Desc || t.step3Desc}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Custom Sections: Bottom Position */}
            {bottomSections.map((sec) => (
              <motion.div key={sec.id} variants={itemVariants}>
                <CustomSectionRenderer section={sec} dir={dir} />
              </motion.div>
            ))}
          </motion.div>
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
