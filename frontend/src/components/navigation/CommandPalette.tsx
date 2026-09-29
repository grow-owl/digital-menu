import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, ShieldCheck, ChefHat, Layers, Receipt, Award, Settings, User, Sparkles, X, QrCode } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Entities';
  icon: any;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items: CommandItem[] = [
    { id: 'nav-admin', title: 'Admin & Executive Portal (Finance, Live Kitchen & Floor)', category: 'Navigation', icon: ShieldCheck, action: () => { navigate('/admin'); onClose(); } },
    { id: 'nav-qr', title: 'Table QR Stands & Print Studio (All Tables)', category: 'Navigation', icon: QrCode, action: () => { navigate('/admin/qr-generator'); onClose(); } },
    { id: 'nav-kds', title: 'Kitchen Display System (KDS)', category: 'Navigation', icon: ChefHat, action: () => { navigate('/kitchen/kds'); onClose(); } },
    { id: 'nav-waiter', title: 'Waiter Floor Mission Control', category: 'Navigation', icon: Layers, action: () => { navigate('/waiter/dashboard'); onClose(); } },
    { id: 'nav-menu', title: 'Customer Chai Addaa Menu', category: 'Navigation', icon: Sparkles, action: () => { navigate('/'); onClose(); } },
    { id: 'nav-settings', title: 'SaaS Platform Settings', category: 'Navigation', icon: Settings, action: () => { navigate('/settings'); onClose(); } },
    { id: 'nav-profile', title: 'Staff User Profile', category: 'Navigation', icon: User, action: () => { navigate('/profile'); onClose(); } },
    { id: 'act-demo', title: 'Toggle Live Simulation Mode', category: 'Actions', icon: Sparkles, action: () => { alert('Demo simulation toggled'); onClose(); }, shortcut: 'Alt+D' },
    { id: 'act-export', title: 'Export Audit Log Report (CSV)', category: 'Actions', icon: ArrowRight, action: () => { alert('Exporting Audit CSV...'); onClose(); } },
  ];

  const filteredItems = items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-aura-container border border-aura-border text-aura-ivory w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search Header */}
        <div className="p-4 border-b border-aura-border flex items-center space-x-3">
          <Search className="w-5 h-5 text-[#38BDF8]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search pages, or trigger action... (Esc to close)"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-aura-slate focus:outline-none font-mono"
          />
          <button onClick={onClose} className="text-aura-slate hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-aura-border/40">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-aura-slate">No commands or results found</div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all text-xs ${
                    index === selectedIndex ? 'bg-[#38BDF8]/10 text-[#38BDF8] font-bold border border-[#38BDF8]/30' : 'hover:bg-aura-obsidian/60 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-[#38BDF8]" />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] text-aura-slate font-mono uppercase bg-aura-obsidian px-2 py-0.5 rounded border border-aura-border">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="bg-aura-obsidian/80 px-4 py-2.5 border-t border-aura-border flex justify-between items-center text-[10px] text-aura-slate font-mono">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="text-[#38BDF8] font-bold">AURA Command Bar</span>
        </div>
      </div>
    </div>
  );
};
