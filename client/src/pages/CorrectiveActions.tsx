import { useCorrectiveActions } from "@/hooks/use-audit-data";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function CorrectiveActions() {
  const { data: actions, isLoading } = useCorrectiveActions();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Corrective Actions</h1>
          <p className="text-slate-500 mt-1">Track and resolve safety non-compliance issues.</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
          </div>
        ) : actions?.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
             <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="w-6 h-6 text-green-600" />
             </div>
             <h3 className="text-lg font-medium text-slate-900">All Clear</h3>
             <p className="text-slate-500">No open corrective actions found.</p>
           </div>
        ) : (
          actions?.map((action) => (
            <Card key={action.id} className="border-slate-100 hover:shadow-md transition-all">
              <CardContent className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={action.riskLevel} className="uppercase text-[10px] tracking-wider" />
                    <StatusBadge status={action.status} />
                  </div>
                  <h3 className="font-bold text-slate-900">{action.description}</h3>
                  <div className="mt-2 text-sm text-slate-500 flex gap-4">
                     <span>Ref: {action.auditItem.audit.site.name}</span>
                     <span>Due: {action.dueDate ? format(new Date(action.dueDate), 'MMM d, yyyy') : 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-right flex-1 md:flex-none">
                     <p className="text-xs text-slate-400">Assigned To</p>
                     <p className="text-sm font-medium text-slate-700">Auditor</p>
                  </div>
                  <Button variant="outline" size="sm">Update Status</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
