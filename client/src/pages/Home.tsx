import { useAuth } from "@/hooks/use-auth";
import { useDashboardStats, useAudits } from "@/hooks/use-audit-data";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

export default function Home() {
  const { user } = useAuth();
  
  // Auditor View vs Admin View logic
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <AuditorDashboard />;
}

function AuditorDashboard() {
  const { data: audits, isLoading } = useAudits({ status: 'in_progress' });
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Welcome back, Auditor</h1>
          <p className="text-slate-500 mt-1">Ready to start your next inspection?</p>
        </div>
        <Link href="/audits/new">
          <Button size="lg" className="shadow-lg shadow-primary/25 rounded-xl text-base px-6">
            <PlusCircle className="mr-2 h-5 w-5" />
            Start New Audit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl shadow-blue-900/20">
          <CardContent className="p-6">
            <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <p className="text-blue-100 font-medium">Ongoing Audits</p>
            <h3 className="text-4xl font-bold mt-1 font-display">{audits?.length || 0}</h3>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-100 shadow-xl shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-500 font-medium">Completed This Week</p>
            <h3 className="text-4xl font-bold mt-1 font-display text-slate-900">0</h3>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-xl shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-slate-500 font-medium">Pending Actions</p>
            <h3 className="text-4xl font-bold mt-1 font-display text-slate-900">0</h3>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold text-slate-900">In Progress</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : audits?.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No audits in progress</h3>
              <p className="text-slate-500 mt-1 max-w-sm">Start a new audit to track compliance for a site.</p>
              <Link href="/audits/new" className="mt-6">
                <Button variant="outline">Start Audit</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audits?.map((audit) => (
              <Link key={audit.id} href={`/audits/${audit.id}`}>
                <Card className="group hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full border-slate-100">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <StatusBadge status={audit.status} />
                      <span className="text-xs text-slate-400 font-medium">
                        {format(new Date(audit.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                      {audit.site.name}
                    </CardTitle>
                    <CardDescription>{audit.type} Audit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Location</span>
                        <span className="font-medium text-slate-700">{audit.site.location}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-500" 
                          style={{ width: `${audit.score || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span>{audit.score || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  
  const chartData = [
    { name: 'Mon', compliance: 85 },
    { name: 'Tue', compliance: 88 },
    { name: 'Wed', compliance: 92 },
    { name: 'Thu', compliance: 90 },
    { name: 'Fri', compliance: 95 },
    { name: 'Sat', compliance: 89 },
    { name: 'Sun', compliance: 94 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Executive Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of safety compliance and performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Avg. Compliance" 
          value={`${stats?.complianceRate || 0}%`} 
          trend="+2.5%" 
          trendUp={true}
          color="emerald"
          icon={CheckCircle}
        />
        <StatsCard 
          title="Open Actions" 
          value={stats?.openActions || 0} 
          trend="-5" 
          trendUp={true}
          color="blue"
          icon={FileText}
        />
        <StatsCard 
          title="Overdue Actions" 
          value={stats?.overdueActions || 0} 
          trend="+2" 
          trendUp={false}
          color="red"
          icon={AlertTriangle}
        />
        <StatsCard 
          title="Audits this Month" 
          value={stats?.recentAudits.length || 0} 
          trend="+12%" 
          trendUp={true}
          color="indigo"
          icon={ClipboardCheck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2 shadow-sm border-slate-100">
          <CardHeader>
            <CardTitle>Compliance Trend</CardTitle>
            <CardDescription>7-day compliance rate average across all sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="compliance" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.compliance >= 90 ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm border-slate-100">
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>Latest submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats?.recentAudits.slice(0, 5).map((audit) => (
                <div key={audit.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${audit.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Site #{audit.siteId}</p>
                      <p className="text-xs text-slate-500">{format(new Date(audit.date), 'MMM d')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{audit.score || 0}%</span>
                </div>
              ))}
              {(!stats?.recentAudits || stats.recentAudits.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, trend, trendUp, color, icon: Icon }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold font-display mt-2 text-slate-900">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs">
          <span className={`font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend}
          </span>
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
