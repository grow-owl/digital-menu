import React, { useState, useEffect } from 'react';
import { X, User, Phone, CheckCircle2 } from 'lucide-react';
import { useToast } from '../feedback/ToastContainer';
import { useAuthStore } from '../../store/use-auth-store';
import { authService } from '../../services/auth.service';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const { showToast } = useToast();
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const updatedData = await authService.updateProfile(user._id, name, phone);
      updateUser(updatedData);
      showToast('Profile updated successfully!', 'success');
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-2 text-[#0C831F] shadow-sm">
            <User className="w-6 h-6 text-[#0C831F]" />
          </div>
          <h3 className="text-slate-900 font-extrabold text-xl">Edit Profile</h3>
          <p className="text-xs text-slate-500">Update your personal dining details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-3">
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F] focus:bg-white transition-colors"
              />
            </div>

            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile Number (+91)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#0C831F] hover:bg-[#096918] disabled:bg-[#0C831F]/50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default CustomerProfileModal;
