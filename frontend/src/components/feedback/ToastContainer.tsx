import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Isolated Toast Renderer Component to prevent re-rendering app children
const ToastViewport: React.FC<{
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}> = React.memo(({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 sm:top-5 left-4 right-4 sm:left-auto sm:right-5 z-[100] flex flex-col space-y-2 max-w-sm sm:w-80 w-auto pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start space-x-3 transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/40 text-rose-300'
              : 'bg-[#121520]/95 border-[#38BDF8]/40 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-[#38BDF8] flex-shrink-0 mt-0.5" />}

          <div className="flex-1 space-y-0.5">
            <h4 className="font-bold text-xs">{toast.title}</h4>
            <p className="text-[11px] opacity-90 leading-relaxed">{toast.message}</p>
          </div>

          <button onClick={() => onRemove(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Date.now().toString() + Math.random().toString().substring(2, 6);
    const newToast: ToastMessage = {
      id,
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Notice' : 'Information'),
      message,
      type,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
