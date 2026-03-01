import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'emerald' | 'rose';
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white/50 backdrop-blur-sm',
        onClick && 'cursor-pointer hover:shadow-2xl hover:scale-[1.02] active:scale-95'
      )}
      onClick={onClick}
    >
      <div className={cn("absolute top-0 left-0 w-1 h-full opacity-60", {
        'bg-blue-500': color === 'blue',
        'bg-green-500': color === 'green',
        'bg-emerald-500': color === 'emerald',
        'bg-yellow-500': color === 'yellow',
        'bg-red-500': color === 'red',
        'bg-rose-500': color === 'rose',
        'bg-purple-500': color === 'purple',
        'bg-orange-500': color === 'orange',
      })} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">
          {title}
        </CardTitle>
        <div className={cn('rounded-xl p-2.5 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110', colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
        {(description || trend) && (
          <p className="mt-1 flex items-center text-xs text-slate-500">
            {trend && (
              <span
                className={cn(
                  'ml-1 inline-flex items-center',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600'
                )}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                {trendValue && ` ${trendValue}`}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
