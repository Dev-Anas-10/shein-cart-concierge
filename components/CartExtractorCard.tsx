'use client';

import React, { useState } from 'react';
import { extractSheinUrl } from '@/lib/shein-extractor';
import { ExtractedCartResult } from '@/lib/types';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Scissors,
  ShoppingBag,
  ExternalLink,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface CartExtractorCardProps {
  onExtracted: (result: ExtractedCartResult) => void;
  currentDynamicFeePercent: number;
}

const SAMPLE_TEXT = `I found some great items at SHEIN!
These items in my shopping cart are great. I highly recommend them to everyone!
https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g`;

export function CartExtractorCard({ onExtracted, currentDynamicFeePercent }: CartExtractorCardProps) {
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

  const handleUseSample = () => {
    handleTextChange(SAMPLE_TEXT);
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) {
      setError('Please paste your SHEIN cart share text or URL.');
      return;
    }

    const cleanUrl = extractSheinUrl(inputText);
    if (!cleanUrl) {
      setError('No valid SHEIN URL detected. Make sure your message contains a SHEIN link.');
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
        throw new Error(json.error || 'Failed to extract goods from SHEIN link.');
      }

      onExtracted(json.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to SHEIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      {/* Ambient decorative glow behind the card */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-rose-500/20 via-purple-500/15 to-amber-500/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-700 pointer-events-none" />

      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl p-7 sm:p-10 shadow-2xl shadow-neutral-950/5 border border-white/80 ring-1 ring-neutral-900/5">
        {/* Header with pill badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-black uppercase tracking-wider border border-rose-200/60 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                Live SHEIN Parser
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
                <Zap className="w-3 h-3 text-emerald-600" />
                Auto-Regex Stripper
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
              Paste Your SHEIN Cart Message
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-xl font-normal leading-relaxed">
              Users often send the complete share caption from the SHEIN app. Our parser removes the noise, isolates the link, extracts every single good, and applies the dynamic 20% concierge fee.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseSample}
            className="self-start sm:self-center px-4 py-2.5 text-xs font-black bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-950 border border-amber-200/80 rounded-2xl transition-all flex items-center gap-2 shadow-xs hover:shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Scissors className="w-4 h-4 text-amber-600" />
            <span>Load Your Exact Sample</span>
          </button>
        </div>

        {/* Input area */}
        <form onSubmit={handleExtract} className="space-y-5">
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-neutral-950 transition-all border border-neutral-200/80 shadow-inner bg-neutral-50/70">
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`Paste the entire shared text here:\n"I found some great items at SHEIN!\nThese items in my shopping cart are great. I highly recommend them to everyone!\nhttps://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g"`}
                className="w-full p-4 sm:p-5 text-sm text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-400 font-mono resize-y leading-relaxed"
              />

              <div className="px-4 py-2.5 bg-neutral-100/70 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                <span>Supports: onelink.shein.com, m.shein.com, shein.com</span>
                <span>{inputText.length} characters</span>
              </div>
            </div>

            {/* Scraped URL Feedback Bar */}
            {detectedUrl && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 shadow-xs">
                    ✓
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-extrabold text-emerald-950 block">Scraped SHEIN Link:</span>
                    <span className="truncate font-mono text-[11px] text-emerald-800 underline block">
                      {detectedUrl}
                    </span>
                  </div>
                </div>

                <span className="flex-shrink-0 font-extrabold text-[11px] text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
                  Clean & Ready
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-in shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center font-black text-neutral-700 text-xs">
                %
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">Dynamic Markup</span>
                <span className="font-extrabold text-neutral-900 text-xs">
                  +{currentDynamicFeePercent}% Concierge & Customs Fee Applied
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-neutral-950 to-zinc-900 hover:from-black hover:to-neutral-950 text-white font-black text-sm rounded-2xl shadow-xl shadow-black/15 hover:shadow-2xl hover:shadow-black/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-75 cursor-pointer border border-white/10"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting Goods from SHEIN...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-rose-400" />
                  <span>Extract Goods & Preview Cash</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
