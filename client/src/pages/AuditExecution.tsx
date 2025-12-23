import { useParams, Link, useLocation } from "wouter";
import { useAudit, useUpdateAuditItem, useCreateCorrectiveAction, useUpdateAudit } from "@/hooks/use-audit-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCorrectiveActionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Mapping categories to tab values
const CATEGORIES = ["General", "Machinery", "Electrical", "Chemical", "PPE", "Fire"];

export default function AuditExecution() {
  const { id } = useParams();
  const auditId = Number(id);
  const { data: audit, isLoading } = useAudit(auditId);
  const updateAudit = useUpdateAudit();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("General");

  // Calculate stats on the fly
  const stats = useMemo(() => {
    if (!audit) return { percentage: 0, total: 0, completed: 0 };
    const items = audit.items || [];
    const total = items.length;
    const completed = items.filter(i => i.status !== 'pending').length;
    const compliant = items.filter(i => i.status === 'compliant').length;
    const percentage = total === 0 ? 0 : Math.round((compliant / total) * 100);
    return { percentage, total, completed };
  }, [audit]);

  const handleFinish = async () => {
    if (stats.completed < stats.total) {
      toast({
        title: "Incomplete Audit",
        description: "Please complete all checklist items before finishing.",
        variant: "destructive"
      });
      return;
    }
    
    await updateAudit.mutateAsync({ 
      id: auditId, 
      status: "completed",
      score: stats.percentage
    });
    
    setLocation(`/audits/${auditId}/summary`);
  };

  if (isLoading || !audit) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group items by category
  const itemsByCategory = audit.items.reduce((acc, item) => {
    const cat = item.template.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof audit.items>);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur pt-4 pb-4 border-b border-slate-200 -mx-4 px-4 md:-mx-8 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/audits">
              <Button variant="ghost" size="sm" className="-ml-2 text-slate-500 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Audit
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Compliance Score:</span>
              <Badge variant="outline" className={cn(
                "text-lg px-3 py-1 font-bold",
                stats.percentage >= 90 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                stats.percentage >= 70 ? "bg-amber-100 text-amber-700 border-amber-200" :
                "bg-red-100 text-red-700 border-red-200"
              )}>
                {stats.percentage}%
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">{audit.site.name}</h1>
              <p className="text-slate-500 text-sm">
                {new Date(audit.date).toLocaleDateString()} • {audit.type} Audit
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {stats.completed} of {stats.total} items checked
              </span>
              <Button onClick={handleFinish} disabled={stats.completed < stats.total}>
                Finish Audit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:px-0">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto inline-flex w-auto min-w-full md:min-w-0 justify-start">
            {CATEGORIES.map(category => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {CATEGORIES.map(category => (
          <TabsContent key={category} value={category} className="space-y-4 animate-enter">
            {(itemsByCategory[category] || []).map((item) => (
              <AuditItemCard key={item.id} item={item} auditId={auditId} />
            ))}
            {(!itemsByCategory[category] || itemsByCategory[category].length === 0) && (
              <div className="text-center py-12 text-slate-400">
                No items in this category.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AuditItemCard({ item, auditId }: { item: any, auditId: number }) {
  const updateItem = useUpdateAuditItem();
  const [notes, setNotes] = useState(item.notes || "");
  const { toast } = useToast();

  const handleStatusChange = (status: string) => {
    updateItem.mutate({ id: item.id, status });
  };

  const handleNotesBlur = () => {
    if (notes !== item.notes) {
      updateItem.mutate({ id: item.id, notes });
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300 border-l-4",
      item.status === 'compliant' ? "border-l-emerald-500 bg-emerald-50/10" :
      item.status === 'non_compliant' ? "border-l-red-500 bg-red-50/10" :
      "border-l-slate-200"
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                #{item.template.itemNumber}
              </span>
              <span className="text-xs text-primary font-medium">
                {item.template.regulationReference}
              </span>
            </div>
            <p className="text-slate-900 font-medium text-lg leading-snug mb-4">
              {item.template.description}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={item.status === 'compliant' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 md:flex-none",
                  item.status === 'compliant' && "bg-emerald-600 hover:bg-emerald-700"
                )}
                onClick={() => handleStatusChange('compliant')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Compliant
              </Button>
              <Button
                variant={item.status === 'non_compliant' ? 'destructive' : 'outline'}
                className="flex-1 md:flex-none"
                onClick={() => handleStatusChange('non_compliant')}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Non-Compliant
              </Button>
              <Button
                variant={item.status === 'n/a' ? 'secondary' : 'outline'}
                className="flex-1 md:flex-none"
                onClick={() => handleStatusChange('n/a')}
              >
                N/A
              </Button>
            </div>
          </div>

          <div className="w-full md:w-80 space-y-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <Textarea
              placeholder="Add observations..."
              className="resize-none bg-white min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
            />
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ description: "Camera access would open here" })}>
                <Camera className="w-4 h-4 mr-2" />
                Photo
              </Button>
              
              {item.status === 'non_compliant' && (
                <CorrectiveActionDialog auditItemId={item.id} existingActions={item.correctiveActions} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CorrectiveActionDialog({ auditItemId, existingActions }: { auditItemId: number, existingActions: any[] }) {
  const [open, setOpen] = useState(false);
  const createAction = useCreateCorrectiveAction();
  const { user } = useAuth(); // Assume current user assigns action for MVP
  
  const form = useForm({
    resolver: zodResolver(insertCorrectiveActionSchema),
    defaultValues: {
      auditItemId,
      description: "",
      riskLevel: "medium",
      status: "pending",
      assignedToId: user?.id
    }
  });

  const onSubmit = async (data: any) => {
    await createAction.mutateAsync(data);
    setOpen(false);
    form.reset();
  };

  const hasAction = existingActions && existingActions.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasAction ? "default" : "destructive"} 
          size="sm" 
          className={cn("flex-1", hasAction && "bg-amber-600 hover:bg-amber-700")}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {hasAction ? "View Action" : "Add Action"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corrective Action Plan</DialogTitle>
        </DialogHeader>
        
        {hasAction ? (
          <div className="space-y-4">
             <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
               <p className="font-medium text-amber-900">{existingActions[0].description}</p>
               <div className="flex gap-2 mt-2">
                 <Badge variant="outline" className="bg-white">{existingActions[0].riskLevel} Risk</Badge>
                 <Badge variant="outline" className="bg-white">{existingActions[0].status}</Badge>
               </div>
             </div>
             <p className="text-xs text-slate-500">Edit feature coming soon.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Required</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What needs to be done?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          onChange={(e) => field.onChange(new Date(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createAction.isPending}>
                  {createAction.isPending ? "Saving..." : "Create Action Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
