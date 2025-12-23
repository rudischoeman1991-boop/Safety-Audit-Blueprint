import { useParams, Link } from "wouter";
import { useAudit } from "@/hooks/use-audit-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, FileText, ArrowLeft, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";

export default function AuditSummary() {
  const { id } = useParams();
  const { data: audit, isLoading } = useAudit(Number(id));

  if (isLoading || !audit) return null;

  const score = audit.score || 0;
  const nonCompliantItems = audit.items.filter(i => i.status === 'non_compliant');
  const highRiskItems = nonCompliantItems.filter(i => 
    i.correctiveActions?.some(ca => ca.riskLevel === 'high')
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <Link href="/">
        <Button variant="ghost" className="pl-0 hover:bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Audit Report Summary</h1>
          <p className="text-slate-500 mt-1">
            Completed on {format(new Date(audit.date), "MMMM d, yyyy")} • {audit.site.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button>Email Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={cn("border-t-4 shadow-lg", 
          score >= 90 ? "border-t-emerald-500" : score >= 70 ? "border-t-amber-500" : "border-t-red-500"
        )}>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Overall Compliance</p>
            <div className="mt-4 flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" 
                    className={score >= 90 ? "text-emerald-500" : score >= 70 ? "text-amber-500" : "text-red-500"}
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * score) / 100}
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-3xl font-bold font-display">{score}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-100">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-3xl font-bold font-display">{nonCompliantItems.length}</span>
            </div>
            <p className="font-medium text-slate-700">Non-Compliances Found</p>
            <p className="text-sm text-slate-500">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-100">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-3xl font-bold font-display">{highRiskItems.length}</span>
            </div>
            <p className="font-medium text-slate-700">High Risk Findings</p>
            <p className="text-sm text-slate-500">Immediate action required</p>
          </CardContent>
        </Card>
      </div>

      {nonCompliantItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Corrective Action Plan Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nonCompliantItems.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status="non_compliant" />
                      <span className="text-xs font-medium text-slate-500">#{item.template.itemNumber}</span>
                    </div>
                    <p className="font-medium text-slate-900">{item.template.description}</p>
                    {item.notes && <p className="text-sm text-slate-500 mt-2 bg-white p-2 rounded border border-slate-200">"{item.notes}"</p>}
                  </div>
                  
                  <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
                    {item.correctiveActions?.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-700">Action Plan:</p>
                        <p className="text-sm text-slate-600">{item.correctiveActions[0].description}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-white">{item.correctiveActions[0].riskLevel} Risk</Badge>
                          <Badge variant="outline" className="bg-white">Due: {item.correctiveActions[0].dueDate ? format(new Date(item.correctiveActions[0].dueDate), 'MMM d') : 'N/A'}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-red-500 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        No action assigned
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
