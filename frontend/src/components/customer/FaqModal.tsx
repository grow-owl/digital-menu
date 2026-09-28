import React, { useState, useEffect } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp, Loader, PhoneCall } from 'lucide-react';
import { contentService } from '../../services/content.service';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const [faqs, setFaqs] = useState<{question: string, answer: string, category: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    if (isOpen) {
      fetchFaqs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await contentService.getFaqs();
      setFaqs(data);
    } catch (error) {
      console.error('Failed to load FAQs', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800"
      >
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#0C831F]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">FAQs &amp; Support</h2>
              <p className="text-xs text-slate-500">How can we assist your dining experience?</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin text-[#0C831F]" /></div>
          ) : (
            faqs.map((faq, i) => (
              <div 
                key={i} 
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-emerald-300 hover:bg-white"
              >
                <div className="p-4 flex items-center justify-between">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 pr-4">{faq.question}</h3>
                  {openIdx === i ? <ChevronUp className="w-4 h-4 text-[#0C831F] shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                {openIdx === i && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/80 pt-3 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
          
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5">
            <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Need Immediate Assistance?</span>
            </p>
            <p className="text-base font-mono text-[#0C831F] font-black">+91 93827 76017</p>
            <p className="text-[11px] text-slate-500">contact@siligurichaiaddaa.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FaqModal;
