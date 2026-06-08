import { useState } from 'react';
import { Button } from '@/components/ui/button';
<<<<<<< HEAD
=======
import { resetAllData, type ResetProgress } from '@/services/DataResetService';
import { toast, Toaster } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
>>>>>>> a408499b0cc2463f1cffe1b7685f97485d7809f2

export function DataResetPage() {
  const [confirmText, setConfirmText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
<<<<<<< HEAD

  // NOTE: This is a build-blocker placeholder to unblock Vite/electron builds.
  // Hook this up to your real reset implementation when ready.
=======
  const [progress, setProgress] = useState<ResetProgress | null>(null);

>>>>>>> a408499b0cc2463f1cffe1b7685f97485d7809f2
  const canReset = confirmText.trim().toLowerCase() === 'reset';

  const handleReset = async () => {
    if (!canReset || isRunning) return;

    setIsRunning(true);
<<<<<<< HEAD
    try {
      // TODO: Implement actual data reset logic.
      // Example: clear Dexie tables / local cache and optionally re-sync.
      console.warn('DataResetPage: reset requested (placeholder).');
      alert('Data reset is not implemented yet (placeholder).');
      setConfirmText('');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Admin: Data Reset</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        This page is currently a placeholder to unblock the build. A real implementation can be connected later.
      </p>

      <div className="mt-6 rounded-lg border bg-white dark:bg-slate-900 p-4">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Safety check</div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Type <span className="font-semibold">reset</span> to enable the reset button.
        </p>

        <input
          className="mt-3 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={isRunning}
          placeholder="Type reset"
        />

        <Button
          className="mt-4 w-full"
          onClick={handleReset}
          disabled={!canReset || isRunning}
        >
          {isRunning ? 'Resetting...' : 'Reset Data'}
=======
    setProgress({
      stage: 'local',
      current: 'Initiating global system reset...',
      total: 100,
      completed: 0,
      errors: []
    });

    try {
      const result = await resetAllData((p) => {
        setProgress(p);
      });

      if (result.success) {
        toast.success('System database wiped successfully!');
        setProgress({
          stage: 'complete',
          current: 'Wipe complete! Refreshing system environment...',
          total: 100,
          completed: 100,
          errors: []
        });

        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        toast.error(`Reset finished with errors: ${result.errors.length} tables failed.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Fatal reset error: ${err.message || err}`);
    } finally {
      setIsRunning(false);
      setConfirmText('');
    }
  };

  const getPercentage = () => {
    if (!progress) return 0;
    if (progress.stage === 'complete') return 100;
    const base = progress.stage === 'local' ? 0 : 50;
    const factor = progress.total > 0 ? (progress.completed / progress.total) * 50 : 0;
    return Math.min(100, Math.round(base + factor));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <Toaster position="top-center" />
      
      <div className="flex items-center gap-3 border-b pb-4">
        <AlertTriangle className="h-8 w-8 text-red-600 animate-pulse" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Nuclear Option: Data Reset</h1>
          <p className="text-sm text-slate-500">Irreversible administrative procedure to wipe all QMS transaction datasets</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 space-y-2">
        <div className="font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          CRITICAL ADMINISTRATIVE WARNING
        </div>
        <p className="text-sm">
          Executing this procedure will completely and permanently erase <strong>ALL system-entered data</strong> 
          (Products, QC Lab Reagents, STP Protocols, CAPAs, DeviationsHub, etc.) from both your 
          <strong>local IndexedDB cache</strong> and the <strong>remote Supabase cloud tables</strong>.
        </p>
        <p className="text-sm font-semibold">
          🛡️ Secure Note: Your enterprise activation license keys and registered users credentials will NOT be deleted.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        <div className="space-y-1">
          <div className="text-sm font-bold text-slate-800 uppercase tracking-wide">Safety Authentication Check</div>
          <p className="text-sm text-slate-500">
            Type <span className="font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">reset</span> in the box below to enable the nuclear override button.
          </p>
        </div>

        <input
          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold tracking-wide bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={isRunning}
          placeholder="Type reset to confirm data destruction"
        />

        {isRunning && progress && (
          <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                {progress.current}
              </span>
              <span className="font-mono">{getPercentage()}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${getPercentage()}%` }}
              />
            </div>
            {progress.errors.length > 0 && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 max-h-24 overflow-y-auto font-mono">
                {progress.errors.map((e, idx) => (
                  <div key={idx}>• {e}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <Button
          className="w-full py-6 font-bold uppercase tracking-wider text-sm transition-all shadow-md bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-100 disabled:text-slate-400 border-none"
          onClick={handleReset}
          disabled={!canReset || isRunning}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Destruction in Progress...
            </span>
          ) : (
            'Execute Nuclear Data Wipe'
          )}
>>>>>>> a408499b0cc2463f1cffe1b7685f97485d7809f2
        </Button>
      </div>
    </div>
  );
}

