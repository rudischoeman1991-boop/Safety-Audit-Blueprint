
import { db } from "./db";
import {
  users, sites, audits, auditItems, correctiveActions, checklistTemplates,
  type User, type InsertUser, type Site, type InsertSite, type Audit, type InsertAudit,
  type AuditItem, type InsertAuditItem, type CorrectiveAction, type InsertCorrectiveAction,
  type ChecklistTemplate, type AuditWithDetails
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Sites
  getSites(): Promise<Site[]>;
  createSite(site: InsertSite): Promise<Site>;

  // Checklist Templates
  getChecklistTemplates(): Promise<ChecklistTemplate[]>;
  seedChecklistTemplates(): Promise<void>;

  // Audits
  getAudits(filters?: { auditorId?: number; siteId?: number; status?: string }): Promise<(Audit & { site: Site; auditor: User })[]>;
  getAudit(id: number): Promise<AuditWithDetails | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit>;

  // Audit Items
  getAuditItems(auditId: number): Promise<AuditItem[]>;
  updateAuditItem(id: number, item: Partial<InsertAuditItem>): Promise<AuditItem>;
  createAuditItemsBatch(items: InsertAuditItem[]): Promise<AuditItem[]>;

  // Corrective Actions
  getCorrectiveActions(filters?: { status?: string }): Promise<(CorrectiveAction & { auditItem: AuditItem & { audit: Audit & { site: Site } } })[]>;
  createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction>;
  updateCorrectiveAction(id: number, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction>;

  // Stats
  getDashboardStats(): Promise<{ complianceRate: number; openActions: number; overdueActions: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getSites(): Promise<Site[]> {
    return await db.select().from(sites);
  }

  async createSite(site: InsertSite): Promise<Site> {
    const [newSite] = await db.insert(sites).values(site).returning();
    return newSite;
  }

  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    return await db.select().from(checklistTemplates).orderBy(checklistTemplates.category, checklistTemplates.itemNumber);
  }

  async seedChecklistTemplates(): Promise<void> {
    const count = await db.select({ count: sql`count(*)` }).from(checklistTemplates);
    if (Number(count[0].count) === 0) {
      const templates = [
        { category: "General", itemNumber: "1.1", description: "Floors are clean and free of trip hazards", regulationReference: "OHSA Sec 8" },
        { category: "General", itemNumber: "1.2", description: "Lighting is adequate in all areas", regulationReference: "OHSA Sec 8" },
        { category: "Machinery", itemNumber: "2.1", description: "Guarding is in place on all moving parts", regulationReference: "DMR Reg 2" },
        { category: "Machinery", itemNumber: "2.2", description: "Emergency stops are functional and accessible", regulationReference: "DMR Reg 2" },
        { category: "Electrical", itemNumber: "3.1", description: "Distribution boards are locked and labeled", regulationReference: "EIR Reg 4" },
        { category: "Chemical", itemNumber: "4.1", description: "SDS available for all hazardous chemicals", regulationReference: "HCS Reg 9A" },
        { category: "PPE", itemNumber: "5.1", description: "Employees wearing required safety boots", regulationReference: "GSR Reg 2" },
        { category: "Fire", itemNumber: "6.1", description: "Fire extinguishers are serviced and accessible", regulationReference: "ERW Reg 9" },
      ];
      await db.insert(checklistTemplates).values(templates);
    }
  }

  async getAudits(filters?: { auditorId?: number; siteId?: number; status?: string }): Promise<(Audit & { site: Site; auditor: User })[]> {
    let query = db.select({
      audit: audits,
      site: sites,
      auditor: users,
    })
    .from(audits)
    .innerJoin(sites, eq(audits.siteId, sites.id))
    .innerJoin(users, eq(audits.auditorId, users.id));

    if (filters?.auditorId) {
      query.where(eq(audits.auditorId, filters.auditorId));
    }
    // Add other filters as needed (requires constructing where clause dynamically or using 'and')

    const results = await query.orderBy(desc(audits.date));
    return results.map(r => ({ ...r.audit, site: r.site, auditor: r.auditor }));
  }

  async getAudit(id: number): Promise<AuditWithDetails | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    if (!audit) return undefined;

    const [site] = await db.select().from(sites).where(eq(sites.id, audit.siteId));
    const [auditor] = await db.select().from(users).where(eq(users.id, audit.auditorId));
    
    const items = await db.select().from(auditItems).where(eq(auditItems.auditId, id));
    
    // Fetch details for items
    const itemsWithDetails = await Promise.all(items.map(async (item) => {
      const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, item.checklistTemplateId));
      const actions = await db.select().from(correctiveActions).where(eq(correctiveActions.auditItemId, item.id));
      return { ...item, template, correctiveActions: actions };
    }));

    return { ...audit, site, auditor, items: itemsWithDetails };
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [newAudit] = await db.insert(audits).values(audit).returning();
    // Auto-create audit items from templates
    const templates = await this.getChecklistTemplates();
    const items = templates.map(t => ({
      auditId: newAudit.id,
      checklistTemplateId: t.id,
      status: "pending",
    }));
    if (items.length > 0) {
      await db.insert(auditItems).values(items);
    }
    return newAudit;
  }

  async updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit> {
    const [updated] = await db.update(audits).set(audit).where(eq(audits.id, id)).returning();
    return updated;
  }

  async getAuditItems(auditId: number): Promise<AuditItem[]> {
    return await db.select().from(auditItems).where(eq(auditItems.auditId, auditId));
  }

  async updateAuditItem(id: number, item: Partial<InsertAuditItem>): Promise<AuditItem> {
    const [updated] = await db.update(auditItems).set(item).where(eq(auditItems.id, id)).returning();
    return updated;
  }

  async createAuditItemsBatch(items: InsertAuditItem[]): Promise<AuditItem[]> {
    return await db.insert(auditItems).values(items).returning();
  }

  async getCorrectiveActions(filters?: { status?: string }): Promise<(CorrectiveAction & { auditItem: AuditItem & { audit: Audit & { site: Site } } })[]> {
    // Simplified join for MVP
    const actions = await db.select().from(correctiveActions);
    // In a real app, do proper joins. Here we'll just fetch relations for simplicity in this generated code
    // actually, let's do one level of joins at least
    const results = [];
    for (const action of actions) {
      const [item] = await db.select().from(auditItems).where(eq(auditItems.id, action.auditItemId));
      const [audit] = await db.select().from(audits).where(eq(audits.id, item.auditId));
      const [site] = await db.select().from(sites).where(eq(sites.id, audit.siteId));
      results.push({ ...action, auditItem: { ...item, audit: { ...audit, site } } });
    }
    return results;
  }

  async createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction> {
    const [newAction] = await db.insert(correctiveActions).values(action).returning();
    return newAction;
  }

  async updateCorrectiveAction(id: number, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction> {
    const [updated] = await db.update(correctiveActions).set(action).where(eq(correctiveActions.id, id)).returning();
    return updated;
  }

  async getDashboardStats(): Promise<{ complianceRate: number; openActions: number; overdueActions: number }> {
    // Mock calculation or real aggregation
    const allAudits = await db.select().from(audits);
    const completedAudits = allAudits.filter(a => a.status === 'completed' && a.score !== null);
    const avgScore = completedAudits.length > 0 
      ? completedAudits.reduce((acc, a) => acc + (a.score || 0), 0) / completedAudits.length 
      : 0;

    const [openActions] = await db.select({ count: sql`count(*)` }).from(correctiveActions).where(eq(correctiveActions.status, 'pending'));
    const [overdueActions] = await db.select({ count: sql`count(*)` }).from(correctiveActions).where(eq(correctiveActions.status, 'overdue'));

    return {
      complianceRate: Math.round(avgScore),
      openActions: Number(openActions.count),
      overdueActions: Number(overdueActions.count),
    };
  }
}

export const storage = new DatabaseStorage();
