import { useAudits, useSites, useUsers } from "@/hooks/use-audit-data";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Filter, Plus, Calendar, MapPin, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function AuditList() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const { data: audits, isLoading } = useAudits({ status: filterStatus || undefined });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Audit History</h1>
          <p className="text-slate-500 mt-1">Manage and review all safety inspections.</p>
        </div>
        <Link href="/audits/new">
          <Button className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            New Audit
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="shadow-sm border-slate-100">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by site name..." 
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loader
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : audits?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500">No audits found matching your criteria.</p>
          </div>
        ) : (
          audits?.map((audit) => (
            <Link key={audit.id} href={`/audits/${audit.id}`}>
              <div className="group bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">
                      {audit.site.name}
                    </h3>
                    <StatusBadge status={audit.status} />
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">
                      {audit.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {audit.site.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(audit.date), "MMMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4" />
                      {audit.auditor.name || audit.auditor.username}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Score</p>
                    <span className={`text-2xl font-bold font-display ${
                      (audit.score || 0) >= 90 ? "text-emerald-600" : 
                      (audit.score || 0) >= 70 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {audit.score || 0}%
                    </span>
                  </div>
                  <Button variant="ghost" className="text-slate-400 group-hover:text-primary">
                    View
                  </Button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
