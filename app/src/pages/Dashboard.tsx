import { useEffect, useMemo } from 'react';
import { useStore } from '@/hooks/useStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import {
  Pill,
  FlaskConical,
  AlertTriangle,
  ClipboardCheck,
  Wrench,
  MessageSquare,
  FileWarning,
  Shield,
  Factory,
  Beaker,
  Truck,
  FileCheck,
} from 'lucide-react';

export function Dashboard() {
  const { state, dispatch } = useStore();
  const now = useMemo(() => Date.now(), []);

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_DATA' });
    dispatch({ type: 'UPDATE_DASHBOARD_STATS' });
  }, [dispatch]);

  const alerts = useMemo(() => [
    // OOS Alerts
    ...state.testResults
      .filter((t) => t.overallResult === 'OOS')
      .map((t) => ({
        id: `oos-${t.id}`,
        type: 'oos' as const,
        title: 'OOS Result',
        description: `Batch ${t.batchNumber} failed test`,
        date: new Date(t.testDate),
        priority: 'critical' as const,
        relatedId: t.id,
      })),
    // Calibration Alerts
    ...state.equipment
      .filter((e) => {
        if (!e.calibrationSchedule.nextCalibration) return false;
        const daysUntil = Math.ceil(
          (new Date(e.calibrationSchedule.nextCalibration).getTime() - now) /
          (1000 * 60 * 60 * 24)
        );
        return daysUntil <= 30 && daysUntil >= 0;
      })
      .map((e) => ({
        id: `cal-${e.id}`,
        type: 'calibration' as const,
        title: 'Calibration Due',
        description: `${e.name} calibration due soon`,
        date: new Date(e.calibrationSchedule.nextCalibration!),
        priority:
          Math.ceil(
            (new Date(e.calibrationSchedule.nextCalibration!).getTime() - now) /
            (1000 * 60 * 60 * 24)
          ) <= 7
            ? ('critical' as const)
            : ('high' as const),
        relatedId: e.id,
      })),
    // Expiry Alerts
    ...state.products
      .filter((p) => {
        const daysUntil = Math.ceil(
          (new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)
        );
        return daysUntil <= 90 && daysUntil >= 0;
      })
      .map((p) => ({
        id: `exp-${p.id}`,
        type: 'expiry' as const,
        title: 'Product Expiring',
        description: `${p.name} expires in ${Math.ceil(
          (new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)
        )} days`,
        date: new Date(p.expiryDate),
        priority:
          Math.ceil(
            (new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)
          ) <= 30
            ? ('critical' as const)
            : ('high' as const),
        relatedId: p.id,
      })),
  ], [state.testResults, state.equipment, state.products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Executive <span className="text-indigo-600">QMS</span> Hub
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            Enterprise Grade Quality Monitoring & Compliance Intelligence
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden xl:flex items-center gap-6 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Lots</p>
              <p className="text-sm font-black text-indigo-600">{state.products.length}</p>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Compliance</p>
              <p className="text-sm font-black text-emerald-600">98.2%</p>
            </div>
          </div>
          <div className="text-right hidden xl:block">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Session Info</p>
            <p className="text-xs font-bold text-slate-700">{new Date().toLocaleTimeString()} | GxP</p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Active System Instance</span>
          </div>
        </div>
      </div>

      {/* Module Quick-Access Ribbon */}
      <div className="flex flex-wrap gap-2 pb-2">
        {[
          { label: 'Quality Assurance', icon: Shield, color: 'indigo' },
          { label: 'Production Control', icon: Factory, color: 'blue' },
          { label: 'Laboratory (QC)', icon: Beaker, color: 'emerald' },
          { label: 'Inventory & Store', icon: Truck, color: 'slate' },
          { label: 'Regulatory / GxP', icon: FileCheck, color: 'purple' },
        ].map((mod, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group">
            <div className={`p-1.5 rounded-lg bg-${mod.color}-50 text-${mod.color}-600 group-hover:scale-110 transition-transform`}>
              <mod.icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{mod.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <StatCard
          title="Prod Assets"
          value={state.dashboardStats.totalProducts}
          icon={Pill}
          color="blue"
        />
        <StatCard
          title="Lab Backlog"
          value={state.dashboardStats.pendingTests}
          icon={FlaskConical}
          color="yellow"
        />
        <StatCard
          title="OOS Alerts"
          value={state.dashboardStats.oosCount}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Deviations"
          value={state.dashboardStats.openDeviations}
          icon={ClipboardCheck}
          color="orange"
        />
        <StatCard
          title="Active CAPA"
          value={state.dashboardStats.openCAPAs}
          icon={ClipboardCheck}
          color="purple"
        />
        <StatCard
          title="Equipment"
          value={state.dashboardStats.upcomingCalibrations}
          icon={Wrench}
          color="blue"
        />
        <StatCard
          title="Complaints"
          value={state.dashboardStats.openComplaints || 0}
          icon={MessageSquare}
          color="rose"
        />
        <StatCard
          title="Active Recalls"
          value={state.dashboardStats.activeRecalls || 0}
          icon={FileWarning}
          color="red"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="bg-slate-900 p-4 border-b border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Global Disposition Distribution
              </h3>
            </div>
            <div className="p-6">
              <StatusChart
                data={state.dashboardStats.productsByStatus}
                title=""
                type="bar"
              />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <ActivityFeed activities={state.activities} />
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Batch Release Accuracy
              </h3>
              <StatusChart
                data={{
                  'Quarantine': state.dashboardStats.productsByStatus.Quarantine,
                  'Approved': state.dashboardStats.productsByStatus.Approved,
                  'Rejected': state.dashboardStats.productsByStatus.Rejected,
                  'Released': state.dashboardStats.productsByStatus.Released,
                }}
                title=""
                type="pie"
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <AlertsPanel alerts={alerts} />

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-500/30">
            <div className="flex items-start justify-between mb-8">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <ClipboardCheck className="h-6 w-6 text-indigo-100" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">System Priority</p>
                <p className="text-2xl font-black italic">HIGH</p>
              </div>
            </div>
            <h4 className="text-lg font-bold mb-2">Internal Audit Preparation</h4>
            <p className="text-sm text-indigo-100/80 mb-6 leading-relaxed">
              Ensure all Market Complaint investigations from Batch BTC2024 are closed before the next regulatory inspection.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[75%]" />
              </div>
              <span className="text-xs font-black">75%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

