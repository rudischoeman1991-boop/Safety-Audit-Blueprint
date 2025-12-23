import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertAudit, type InsertAuditItem, type InsertCorrectiveAction, type InsertSite } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// === SITES ===
export function useSites() {
  return useQuery({
    queryKey: [api.sites.list.path],
    queryFn: async () => {
      const res = await fetch(api.sites.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sites");
      return api.sites.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertSite) => {
      const res = await fetch(api.sites.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create site");
      return api.sites.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sites.list.path] });
      toast({ title: "Site Created", description: "New site added successfully." });
    },
  });
}

// === AUDITS ===
export function useAudits(filters?: { auditorId?: number; siteId?: number; status?: string }) {
  return useQuery({
    queryKey: [api.audits.list.path, filters],
    queryFn: async () => {
      // Build query string manually or use helper if needed, simplistic for now
      let url = api.audits.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.auditorId) params.append("auditorId", filters.auditorId.toString());
        if (filters.siteId) params.append("siteId", filters.siteId.toString());
        if (filters.status) params.append("status", filters.status);
        if (params.toString()) url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audits");
      return api.audits.list.responses[200].parse(await res.json());
    },
  });
}

export function useAudit(id: number) {
  return useQuery({
    queryKey: [api.audits.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.audits.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit details");
      return api.audits.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertAudit) => {
      const res = await fetch(api.audits.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start audit");
      return api.audits.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.audits.list.path] });
      toast({ title: "Audit Started", description: "You can now begin the checklist." });
    },
  });
}

export function useUpdateAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertAudit> & { id: number }) => {
      const url = buildUrl(api.audits.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update audit");
      return api.audits.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.audits.get.path, data.id] });
      queryClient.invalidateQueries({ queryKey: [api.audits.list.path] });
      toast({ title: "Audit Updated", description: "Changes saved successfully." });
    },
  });
}

// === AUDIT ITEMS ===
export function useUpdateAuditItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertAuditItem> & { id: number }) => {
      const url = buildUrl(api.auditItems.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update item");
      return api.auditItems.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant audit to refresh progress/details
      // We don't have auditId here easily without prop drilling, but we can invalidate all audit details for simplicity or rely on return
      queryClient.invalidateQueries({ queryKey: [api.audits.get.path] }); 
    },
  });
}

// === CORRECTIVE ACTIONS ===
export function useCorrectiveActions(filters?: { status?: string }) {
  return useQuery({
    queryKey: [api.correctiveActions.list.path, filters],
    queryFn: async () => {
      let url = api.correctiveActions.list.path;
      if (filters?.status) {
        url += `?status=${filters.status}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch actions");
      return api.correctiveActions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCorrectiveAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertCorrectiveAction) => {
      const res = await fetch(api.correctiveActions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create action");
      return api.correctiveActions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.correctiveActions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.audits.get.path] }); // Also refresh audit view
      toast({ title: "Action Created", description: "Corrective action has been assigned." });
    },
  });
}

export function useUpdateCorrectiveAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertCorrectiveAction> & { id: number }) => {
      const url = buildUrl(api.correctiveActions.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update action");
      return api.correctiveActions.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.correctiveActions.list.path] });
      toast({ title: "Action Updated", description: "Status changed successfully." });
    },
  });
}

// === TEMPLATES & STATS ===
export function useChecklistTemplates() {
  return useQuery({
    queryKey: [api.checklistTemplates.list.path],
    queryFn: async () => {
      const res = await fetch(api.checklistTemplates.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return api.checklistTemplates.list.responses[200].parse(await res.json());
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.stats.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.stats.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.dashboard.responses[200].parse(await res.json());
    },
  });
}

// === USERS ===
export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}
