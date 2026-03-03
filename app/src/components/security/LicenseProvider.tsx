import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import { type LicenseStatus } from '@/services/LicenseManager';

// ==================== Visitor Session Keys ====================
const VISITOR_EXPIRY_KEY  = 'pharma_visitor_expiry';
const VISITOR_ACTIVE_KEY  = 'pharma_visitor_active';

// ==================== Types ====================
export interface VisitorSession {
  active: boolean;
  expiry: Date | null;
  daysRemaining: number;
}

interface LicenseContextType {
  status: LicenseStatus;
  activate: (key: string) => boolean;
  // Visitor access
  visitorSession: VisitorSession;
  activateVisitor: () => void;
  revokeVisitor: () => void;
}

// ==================== Helpers ====================
function daysRemaining(expiry: Date | null): number {
  if (!expiry) return 0;
  const ms = new Date(expiry).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function loadVisitorSession(): VisitorSession {
  try {
    const active = localStorage.getItem(VISITOR_ACTIVE_KEY) === 'true';
    const expiryStr = localStorage.getItem(VISITOR_EXPIRY_KEY);
    if (active && expiryStr) {
      const expiry = new Date(expiryStr);
      if (expiry > new Date()) {
        return { active: true, expiry, daysRemaining: daysRemaining(expiry) };
      }
      // Expired — clean up
      localStorage.removeItem(VISITOR_ACTIVE_KEY);
      localStorage.removeItem(VISITOR_EXPIRY_KEY);
    }
  } catch { /* ignore */ }
  return { active: false, expiry: null, daysRemaining: 0 };
}

const LicenseContext = createContext<LicenseContextType | null>(null);

// Always valid license — public access for everyone
const PUBLIC_LICENSE_STATUS: LicenseStatus = {
  isValid: true,
  expiryDate: null,
  daysRemaining: 999,
  message: 'Public Access - Open for All',
};

// ==================== Provider ====================
export function LicenseProvider({ children }: { children: ReactNode }) {
  const [status] = useState<LicenseStatus>(PUBLIC_LICENSE_STATUS);
  const [visitorSession, setVisitorSession] = useState<VisitorSession>(loadVisitorSession);

  // Re-check session every minute for expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const session = loadVisitorSession();
      setVisitorSession(session);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const activate = (_key: string): boolean => {
    // No activation needed — public access
    return true;
  };

  const activateVisitor = () => {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 3);
    try {
      localStorage.setItem(VISITOR_ACTIVE_KEY, 'true');
      localStorage.setItem(VISITOR_EXPIRY_KEY, expiry.toISOString());
    } catch { /* ignore */ }
    setVisitorSession({ active: true, expiry, daysRemaining: daysRemaining(expiry) });
  };

  const revokeVisitor = () => {
    try {
      localStorage.removeItem(VISITOR_ACTIVE_KEY);
      localStorage.removeItem(VISITOR_EXPIRY_KEY);
    } catch { /* ignore */ }
    setVisitorSession({ active: false, expiry: null, daysRemaining: 0 });
  };

  const isDev = import.meta.env.DEV;

  return (
    <LicenseContext.Provider value={{ status, activate, visitorSession, activateVisitor, revokeVisitor }}>
      {children}

      {/* Subtle badge */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-20 hover:opacity-100 transition-opacity">
        <div className="backdrop-blur-sm shadow-sm flex items-center gap-1 border border-slate-200 px-2 py-1 rounded bg-white/80 dark:bg-slate-900/80">
          {visitorSession.active ? (
            <>
              <Clock className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-900">
                Visitor • {visitorSession.daysRemaining}d left
              </span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-900">
                {isDev ? 'Dev Mode: Unlocked' : 'Public Access'}
              </span>
            </>
          )}
        </div>
      </div>
    </LicenseContext.Provider>
  );
}

// ==================== Hook ====================
export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) throw new Error('useLicense must be used within a LicenseProvider');
  return context;
}
