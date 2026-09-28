import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TableState {
  activeTableId: string | null;
  activeSessionId: string | null;
  qrToken: string | null;
  isVerified: boolean;
  verifiedAt: number | null;
  setActiveSession: (tableId: string, sessionId: string, token: string, isVerified?: boolean) => void;
  clearSession: () => void;
}

export const useTableStore = create<TableState>()(
  persist(
    (set) => ({
      activeTableId: null,
      activeSessionId: null,
      qrToken: null,
      isVerified: false,
      verifiedAt: null,
      
      setActiveSession: (tableId, sessionId, token, isVerified = true) => {
        set({
          activeTableId: String(tableId),
          activeSessionId: sessionId,
          qrToken: token,
          isVerified: Boolean(isVerified),
          verifiedAt: Date.now()
        });
      },
      
      clearSession: () => {
        set({
          activeTableId: null,
          activeSessionId: null,
          qrToken: null,
          isVerified: false,
          verifiedAt: null
        });
      }
    }),
    {
      name: 'aura-table-session',
    }
  )
);
