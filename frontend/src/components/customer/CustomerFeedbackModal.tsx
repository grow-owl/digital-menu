import React, { useState } from 'react';
import { Star, X, MessageSquare, ExternalLink, CheckCircle2, Heart, Award, Sparkles } from 'lucide-react';
import { useToast } from '../feedback/ToastContainer';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useAuthStore } from '../../store/use-auth-store';
import { loyaltyService } from '../../services/loyalty.service';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  onClose,
  orderId = 'ORD-8901',
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bonusEarned, setBonusEarned] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (user?.phone) {
        const res = await loyaltyService.claimFeedbackBonus({
          phone: user.phone,
          orderId,
          rating,
          feedback: feedbackText
        }).catch(() => null);

        if (res?.success) {
          setBonusEarned(50);
          useAuthStore.getState().updateUser({
            ...user,
            loyaltyPoints: res.data.loyaltyPoints,
            loyaltyTier: res.data.loyaltyTier
          });
          showToast(res.message || '🎉 +50 Chai Adda Points added to your wallet!', 'success');
        } else {
          showToast('Thank you for rating your dining experience!', 'success');
        }
      } else {
        showToast('Thank you for your feedback! Register to earn points on reviews.', 'info');
      }
    } finally {
      setIsSubmitted(true);
      setIsSubmitting(false);
    }
  };

  const handleGoogleReview = () => {
    // Open Google Review Link in a new tab
    window.open('https://search.google.com/local/writereview?placeid=ChIJN1t_tMoWrjsR00000000000', '_blank');
    showToast('Thank you! Our concierge will verify your review for bonus points.', 'success');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5 text-center">
            <div className="w-14 h-14 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-sm">
              <Award className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-extrabold text-2xl text-slate-900">Rate Your Experience</h3>
              <p className="text-xs text-slate-500 mt-1">Order #{orderId} • Siliguri's Chai Addaa</p>
            </div>

            {/* Star Rating Inputs */}
            <div className="flex items-center justify-center space-x-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 transition-all ${
                        active
                          ? 'fill-[#F7D046] text-[#F7D046] drop-shadow-sm'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Conditional Rating Prompt */}
            {rating >= 4 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-emerald-800 flex items-center justify-center space-x-1">
                  <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  <span>We're thrilled you enjoyed your dining!</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  Help us spread the word on Google Reviews &amp; get +100 Loyalty Points!
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-amber-900">
                  How can we make it better next time?
                </p>
                <p className="text-[11px] text-slate-600">
                  Your feedback goes directly to our Executive Chef &amp; Manager.
                </p>
              </div>
            )}

            {/* Optional Comment Box */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Private Feedback / Remarks</span>
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts about food taste, ambiance, or service..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F] focus:bg-white h-20 resize-none transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-[#0C831F] hover:bg-[#096918] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        ) : (
          <div className="py-6 space-y-5 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-[#0C831F] border border-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-md animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-2xl text-slate-900">Thank You!</h3>
              <p className="text-xs text-slate-500">Your review has been recorded by AURA Management.</p>
            </div>

            {bonusEarned > 0 && (
              <div className="p-3 bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 border border-amber-300 rounded-2xl flex items-center justify-center space-x-2 text-amber-950 font-bold text-xs shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                <span>+{bonusEarned} AURA Club Points Credited to Wallet!</span>
              </div>
            )}

            {/* Google Review Trigger for 4+ Star Ratings */}
            {rating >= 4 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#0C831F] uppercase tracking-wider block">
                    🎁 Bonus Reward Offer
                  </span>
                  <p className="text-xs text-slate-800 font-medium">
                    Post your review on Google to claim <strong className="text-[#0C831F] font-bold">+100 Loyalty Points</strong>!
                  </p>
                </div>

                <button
                  onClick={handleGoogleReview}
                  className="w-full py-3 px-4 bg-[#0C831F] hover:bg-[#096918] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Post on Google Reviews</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default CustomerFeedbackModal;
