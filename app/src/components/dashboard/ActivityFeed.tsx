import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Activity } from '@/types';
import {
  Pill,
  FlaskConical,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface ActivityFeedProps {
  activities: Activity[];
}

const activityIcons: Record<string, React.ElementType> = {
  Product_Created: Pill,
  Product_Updated: Pill,
  Test_Completed: FlaskConical,
  OOS_Investigation: AlertTriangle,
  Deviation_Created: AlertTriangle,
  CAPA_Created: ClipboardCheck,
  CAPA_Closed: ClipboardCheck,
  Document_Approved: FileText,
  Training_Completed: GraduationCap,
  Audit_Completed: Users,
  Complaint_Created: AlertTriangle,
  Recall_Initiated: FileText,
};

const activityColors: Record<string, string> = {
  Product_Created: 'text-blue-600 bg-blue-100',
  Product_Updated: 'text-blue-600 bg-blue-100',
  Test_Completed: 'text-green-600 bg-green-100',
  OOS_Investigation: 'text-red-600 bg-red-100',
  Deviation_Created: 'text-orange-600 bg-orange-100',
  CAPA_Created: 'text-purple-600 bg-purple-100',
  CAPA_Closed: 'text-green-600 bg-green-100',
  Document_Approved: 'text-indigo-600 bg-indigo-100',
  Training_Completed: 'text-cyan-600 bg-cyan-100',
  Audit_Completed: 'text-pink-600 bg-pink-100',
  Complaint_Created: 'text-rose-600 bg-rose-100',
  Recall_Initiated: 'text-red-700 bg-red-100',
};

const activityLabels: Record<string, string> = {
  Product_Created: 'New Product registered',
  Product_Updated: 'Product record updated',
  Test_Completed: 'Analysis finalized',
  OOS_Investigation: 'OOS investigation logic',
  Deviation_Created: 'Deviation logged',
  CAPA_Created: 'CAPA record initiated',
  CAPA_Closed: 'CAPA finalized/closed',
  Document_Approved: 'System SOP approved',
  Training_Completed: 'Staff training verified',
  Audit_Completed: 'Protocol audit finalized',
  Complaint_Created: 'Market complaint logged',
  Recall_Initiated: 'PRODUCT RECALL INITIATED',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Real-time GxP Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-6">
            {activities.length === 0 ? (
              <p className="text-center text-slate-500 italic py-10">No recent quality activities logged</p>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.type] || FileText;
                const colorClass = activityColors[activity.type] || 'text-slate-600 bg-slate-100';
                const label = activityLabels[activity.type] || activity.type;

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {label}
                      </p>
                      <p className="text-sm text-slate-600">{activity.description}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>{activity.user}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
