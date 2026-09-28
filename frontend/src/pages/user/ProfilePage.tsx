import React from 'react';
import { User, ShieldCheck, Mail, Phone, Calendar, Clock, Award, Key, Sparkles } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-6 max-w-7xl mx-auto space-y-6 pb-24 font-sans text-aura-ivory">
      {/* Header */}
      <div className="border-b border-aura-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-[#38BDF8]" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wide text-white">STAFF USER PROFILE</h1>
            <p className="text-xs text-aura-slate">Personal Shift Schedule, Role Permissions & Credentials</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Badge Card */}
        <div className="bg-aura-container/80 backdrop-blur-xl border border-[#38BDF8]/20 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#38BDF8]/10 border-2 border-[#38BDF8] mx-auto flex items-center justify-center font-serif text-2xl font-bold text-[#38BDF8] shadow-xl">
            AW
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-white">Alexander Wright</h2>
            <p className="text-xs text-aura-slate">Lead Product Engineer & Systems Admin</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> ADMIN ROLE
          </span>
        </div>

        {/* Profile Details */}
        <div className="md:col-span-2 bg-aura-container/80 backdrop-blur-xl border border-[#38BDF8]/20 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="font-serif text-base font-bold text-white border-b border-aura-border pb-3">Staff Credentials & Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#090A0F] border border-[#38BDF8]/20 space-y-1">
              <span className="text-aura-slate font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#38BDF8]" /> Email Address</span>
              <p className="font-bold text-white">admin@aura.com</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090A0F] border border-[#38BDF8]/20 space-y-1">
              <span className="text-aura-slate font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#38BDF8]" /> Contact Phone</span>
              <p className="font-bold text-white">+1 (555) 019-2832</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090A0F] border border-[#38BDF8]/20 space-y-1">
              <span className="text-aura-slate font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#38BDF8]" /> Assigned Shift</span>
              <p className="font-bold text-white">Dinner Service (16:00 - 24:00)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090A0F] border border-[#38BDF8]/20 space-y-1">
              <span className="text-aura-slate font-semibold flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-[#38BDF8]" /> Employee ID</span>
              <p className="font-mono font-bold text-[#38BDF8]">EMP-2026-001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
