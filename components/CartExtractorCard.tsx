'use client';

import React, { useState } from 'react';
import { extractSheinUrl } from '@/lib/shein-extractor';
import { ExtractedCartResult } from '@/lib/types';
import { useThemeLang } from '@/lib/theme-lang-context';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CartExtractorCardProps {
  onExtracted: (result: ExtractedCartResult) => void;
  currentDynamicFeePercent: number;
}

export function CartExtractorCard({ onExtracted, currentDynamicFeePercent }: CartExtractorCardProps) {
  const { t, dir } = useThemeLang();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  const handleTextChange = (val: string) => {
    setInputText(val);
    setError(null);
    const link = extractSheinUrl(val);
    setDetectedUrl(link);
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) {
      setError(
        dir === 'rtl'
          ? 'يرجى لصق نص مشاركة السلة من تطبيق شي إن أو الرابط أولاً.'
          : 'Please paste your SHEIN cart share text or URL.'
      );
      return;
    }

    const cleanUrl = extractSheinUrl(inputText);
    if (!cleanUrl) {
      setError(
        dir === 'rtl'
          ? 'لم يتم العثور على رابط شي إن صالح. تأكد من أن الرسالة تحتوي على رابط SHEIN.'
          : 'No valid SHEIN URL detected. Make sure your message contains a SHEIN link.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          dynamicFeePercent: currentDynamicFeePercent,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.error ||
            (dir === 'rtl'
              ? 'تعذر استخراج المنتجات من رابط شي إن.'
              : 'Failed to extract goods from SHEIN link.')
        );
      }

      onExtracted(json.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to SHEIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 transition-colors">
      {/* Top Graphic Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
        <div className="space-y-2 text-center sm:text-start">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#7C3AED] text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              {t.extractorBadge}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-medium">
              +{currentDynamicFeePercent}% {t.feeLabel}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {t.extractorTitle}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-lg leading-relaxed">
            {t.extractorDesc}
          </p>
        </div>

        {/* Minimalist Vector Illustration Badge */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#F3E8FF] rounded-full scale-95" />
          <svg className="w-20 h-20 relative z-10" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="38" fill="#E9D5FF" opacity="0.6" />
            <rect x="25" y="42" width="50" height="32" rx="6" fill="#FFFFFF" stroke="#18181B" strokeWidth="2.5" />
            <path d="M40 74L36 84H64L60 74" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 84H80" stroke="#18181B" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="56" r="6" fill="#A78BFA" />
            <path d="M68 28C74 34 68 46 76 50" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Pill Filter Badges (Sample Cart removed cleanly!) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-50 text-neutral-600 border border-neutral-200/80">
          {t.autoLinkBadge}
        </span>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-50 text-neutral-600 border border-neutral-200/80">
          {t.paymentBadge}
        </span>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-50 text-neutral-600 border border-neutral-200/80">
          {t.adminVerifiedBadge}
        </span>
      </div>

      {/* Form Input Container */}
      <form onSubmit={handleExtract} className="space-y-4 pt-2">
        <div className="relative rounded-2xl border border-neutral-200 focus-within:border-[#A78BFA] focus-within:ring-2 focus-within:ring-purple-100 transition-all bg-[#FBFBFC]">
          <div className="flex items-center gap-3 px-4 pt-3.5 text-neutral-400">
            <Search className="w-4 h-4 text-neutral-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              SHEIN Share Box
            </span>
          </div>

          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t.placeholder}
            className="w-full px-4 py-3 text-xs sm:text-sm text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-400 font-sans resize-y leading-relaxed"
          />

          <div className="px-4 py-2.5 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{t.acceptsHint}</span>
            <span>
              {inputText.length} {t.chars}
            </span>
          </div>
        </div>

        {/* Scraped URL Feedback */}
        {detectedUrl && (
          <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-neutral-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <CheckCircle2 className="w-4 h-4 text-[#8B5CF6] shrink-0" />
              <div className="overflow-hidden">
                <span className="font-bold text-[#6D28D9] block text-[11px]">{t.validLinkDetected}</span>
                <span className="truncate font-mono text-[11px] text-neutral-700 block">
                  {detectedUrl}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-[#7C3AED] bg-white px-2.5 py-1 rounded-full border border-purple-200">
              {t.ready}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t.extracting}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{t.extractBtn}</span>
                {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
