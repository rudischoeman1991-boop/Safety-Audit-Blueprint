import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAuditSchema, insertSiteSchema, type InsertSite } from "@shared/schema";
import { z } from "zod";
import { useSites, useCreateSite, useCreateAudit } from "@/hooks/use-audit-data";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Combine schemas for UI logic if needed, but we treat Site selection separately
const auditFormSchema = insertAuditSchema.extend({
  siteId: z.coerce.number().min(1, "Please select a site"),
});

export default function AuditSetup() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: sites, isLoading: isLoadingSites } = useSites();
  const createAudit = useCreateAudit();
  
  const form = useForm<z.infer<typeof auditFormSchema>>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      type: "Routine",
      status: "in_progress",
      score: 0,
      date: new Date(),
      auditorId: user?.id,
    },
  });

  const onSubmit = async (data: z.infer<typeof auditFormSchema>) => {
    // Ensure auditorId is set from auth context if missing
    const payload = {
      ...data,
      auditorId: user?.id!, 
    };
    
    const result = await createAudit.mutateAsync(payload);
    if (result) {
      setLocation(`/audits/${result.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setLocation("/")} className="pl-0 hover:bg-transparent hover:text-primary">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-slate-900">New Audit Inspection</h1>
        <p className="text-slate-500">Configure the details for the site visit.</p>
      </div>

      <Card className="border-slate-100 shadow-xl shadow-slate-200/40">
        <CardHeader>
          <CardTitle>Audit Details</CardTitle>
          <CardDescription>Select a site and audit type to generate the checklist.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <FormField
                    control={form.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Site Location</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value?.toString()}
                          disabled={isLoadingSites}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 bg-slate-50">
                              <SelectValue placeholder="Select a site..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sites?.map((site) => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.name} ({site.location})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <CreateSiteDialog />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audit Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-slate-50">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Routine">Routine Inspection</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                          <SelectItem value="Incident">Incident Investigation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audit Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="h-12 bg-slate-50"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto px-8 rounded-xl shadow-lg shadow-primary/25"
                  disabled={createAudit.isPending}
                >
                  {createAudit.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Start Audit Checklist"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateSiteDialog() {
  const createSite = useCreateSite();
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<InsertSite>({
    resolver: zodResolver(insertSiteSchema),
    defaultValues: { name: "", location: "", industry: "" }
  });

  const onSubmit = async (data: InsertSite) => {
    await createSite.mutateAsync(data);
    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="h-12 w-12 border-slate-200" title="Add new site">
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Site</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Warehouse A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input placeholder="e.g. Johannesburg" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl><Input placeholder="e.g. Manufacturing" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={createSite.isPending}>
              {createSite.isPending ? "Adding..." : "Add Site"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
