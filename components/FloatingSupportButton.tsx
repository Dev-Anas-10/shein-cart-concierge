'use client';

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useThemeLang } from '@/lib/theme-lang-context';
import { SupportModal } from './SupportModal';

export function FloatingSupportButton() {
  const [open, setOpen] = useState(false);
  const { lang, dir } = useThemeLang();

  const isRtl = dir === 'rtl';

  return (
    <>
      <div className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} z-40`}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-xs rounded-full shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          title={isRtl ? 'تحتاج مساعدة؟ تواصل مع الدعم الفني' : 'Need help? Contact Concierge Support'}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isRtl ? 'خدمة العملاء' : 'Support Contact'}
          </span>
        </button>
      </div>

      <SupportModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
