import { db } from "./db";
import {
  users, sites, audits, auditItems, correctiveActions, checklistTemplates, auditApprovals,
  type User, type InsertUser, type Site, type InsertSite, type Audit, type InsertAudit,
  type AuditItem, type InsertAuditItem, type CorrectiveAction, type InsertCorrectiveAction,
  type ChecklistTemplate, type AuditApproval, type InsertAuditApproval
} from "@shared/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getSites(): Promise<Site[]>;
  createSite(site: InsertSite): Promise<Site>;
  getChecklistTemplates(): Promise<ChecklistTemplate[]>;
  seedChecklistTemplates(): Promise<void>;
  getAudits(filters?: { auditorId?: number; siteId?: number; status?: string }): Promise<(Audit & { site: Site; auditor: User })[]>;
  getAudit(id: number): Promise<Audit | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit>;
  getAuditItems(auditId: number): Promise<AuditItem[]>;
  updateAuditItem(id: number, item: Partial<InsertAuditItem>): Promise<AuditItem>;
  getCorrectiveActions(filters?: { status?: string }): Promise<CorrectiveAction[]>;
  createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction>;
  updateCorrectiveAction(id: number, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction>;
  createAuditApproval(approval: InsertAuditApproval): Promise<AuditApproval>;
  getAuditApprovals(auditId: number): Promise<AuditApproval[]>;
  getDashboardStats(): Promise<{ complianceRate: number; openActions: number; overdueActions: number; totalAudits: number }>;
  calculateAuditScore(auditId: number): Promise<number>;
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
        // OHSA Questions
        { category: "General Compliance", legislation: "OHSA", itemNumber: "1.1", description: "Safety policy documented and communicated", regulationReference: "OHSA Sec 8", riskLevel: "high", applicableIndustries: ["All"] },
        { category: "General Compliance", legislation: "OHSA", itemNumber: "1.2", description: "Safety committee established (if >20 employees)", regulationReference: "OHSA Sec 72", riskLevel: "high", applicableIndustries: ["All"] },
        { category: "Hazard Management", legislation: "OHSA", itemNumber: "2.1", description: "Hazard identification and risk assessment completed", regulationReference: "OHSA Reg 2", riskLevel: "high", applicableIndustries: ["All"] },
        { category: "Hazard Management", legislation: "OHSA", itemNumber: "2.2", description: "Control measures implemented for identified hazards", regulationReference: "OHSA Reg 2", riskLevel: "high", applicableIndustries: ["All"] },
        
        // NEMA Specific
        { category: "Environmental", legislation: "NEMA", itemNumber: "3.1", description: "Waste management plan implemented", regulationReference: "NEMA Act", riskLevel: "medium", applicableIndustries: ["Manufacturing", "Mining"] },
        { category: "Environmental", legislation: "NEMA", itemNumber: "3.2", description: "Pollution control measures in place", regulationReference: "NEMA Act", riskLevel: "high", applicableIndustries: ["Manufacturing", "Mining"] },
        
        // MHSA Specific
        { category: "Mine Safety", legislation: "MHSA", itemNumber: "4.1", description: "Mine manager appointed and competent", regulationReference: "MHSA Sec 7", riskLevel: "high", applicableIndustries: ["Mining"] },
        { category: "Mine Safety", legislation: "MHSA", itemNumber: "4.2", description: "Rescue and emergency procedures documented", regulationReference: "MHSA Reg 11", riskLevel: "high", applicableIndustries: ["Mining"] },
        
        // Machinery & Equipment (DMR Reg 2)
        { category: "Machinery", legislation: "OHSA", itemNumber: "5.1", description: "Guards on all moving parts", regulationReference: "DMR Reg 2", riskLevel: "high", applicableIndustries: ["Manufacturing", "Mining"] },
        { category: "Machinery", legislation: "OHSA", itemNumber: "5.2", description: "Regular inspection and maintenance records kept", regulationReference: "DMR Reg 2", riskLevel: "medium", applicableIndustries: ["Manufacturing", "Mining"] },
        
        // Electrical (EIR Reg 4)
        { category: "Electrical", legislation: "OHSA", itemNumber: "6.1", description: "Electrical installations certified", regulationReference: "EIR Reg 4", riskLevel: "high", applicableIndustries: ["All"] },
        { category: "Electrical", legislation: "OHSA", itemNumber: "6.2", description: "Lockout/Tagout procedures implemented", regulationReference: "EIR Reg 4", riskLevel: "high", applicableIndustries: ["All"] },
        
        // Chemical (HCS Reg 9A)
        { category: "Chemical", legislation: "OHSA", itemNumber: "7.1", description: "SDS available for all hazardous substances", regulationReference: "HCS Reg 9A", riskLevel: "high", applicableIndustries: ["Manufacturing", "Chemical"] },
        { category: "Chemical", legislation: "OHSA", itemNumber: "7.2", description: "Chemical storage compliant with regulations", regulationReference: "HCS Reg 9A", riskLevel: "high", applicableIndustries: ["Manufacturing", "Chemical"] },
        
        // PPE (GSR Reg 2)
        { category: "PPE", legislation: "OHSA", itemNumber: "8.1", description: "PPE provided and worn appropriately", regulationReference: "GSR Reg 2", riskLevel: "high", applicableIndustries: ["All"] },
        { category: "PPE", legislation: "OHSA", itemNumber: "8.2", description: "PPE inspection and maintenance records", regulationReference: "GSR Reg 2", riskLevel: "medium", applicableIndustries: ["All"] },
        
        // Fire (ERW Reg 9)
        { category: "Fire Safety", legislation: "OHSA", itemNumber: "9.1", description: "Fire extinguishers serviced and accessible", regulationReference: "ERW Reg 9", riskLevel: "high", applicableIndustries: ["All"] },
        { category: "Fire Safety", legislation: "OHSA", itemNumber: "9.2", description: "Emergency exit routes clear and marked", regulationReference: "ERW Reg 9", riskLevel: "high", applicableIndustries: ["All"] },
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

    const results = await query.orderBy(desc(audits.date));
    return results.map(r => ({ ...r.audit, site: r.site, auditor: r.auditor }));
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    return audit;
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    const auditNumber = `AUD-${Date.now()}`;
    const [newAudit] = await db.insert(audits).values({ ...audit, auditNumber }).returning();
    
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

  async getCorrectiveActions(filters?: { status?: string }): Promise<CorrectiveAction[]> {
    return await db.select().from(correctiveActions);
  }

  async createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction> {
    const [newAction] = await db.insert(correctiveActions).values(action).returning();
    return newAction;
  }

  async updateCorrectiveAction(id: number, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction> {
    const [updated] = await db.update(correctiveActions).set(action).where(eq(correctiveActions.id, id)).returning();
    return updated;
  }

  async createAuditApproval(approval: InsertAuditApproval): Promise<AuditApproval> {
    const [newApproval] = await db.insert(auditApprovals).values(approval).returning();
    return newApproval;
  }

  async getAuditApprovals(auditId: number): Promise<AuditApproval[]> {
    return await db.select().from(auditApprovals).where(eq(auditApprovals.auditId, auditId));
  }

  async calculateAuditScore(auditId: number): Promise<number> {
    const items = await this.getAuditItems(auditId);
    if (items.length === 0) return 0;
    
    const compliant = items.filter(i => i.status === 'compliant').length;
    const scored = items.filter(i => i.status !== 'pending' && i.status !== 'n/a').length;
    
    return scored > 0 ? Math.round((compliant / scored) * 100) : 0;
  }

  async getDashboardStats(): Promise<{ complianceRate: number; openActions: number; overdueActions: number; totalAudits: number }> {
    const allAudits = await db.select().from(audits);
    const completedAudits = allAudits.filter(a => a.status === 'completed' && a.score !== null);
    const avgScore = completedAudits.length > 0 
      ? completedAudits.reduce((acc, a) => acc + (a.score || 0), 0) / completedAudits.length 
      : 0;

    const [openCount] = await db.select({ count: sql`count(*)` }).from(correctiveActions).where(eq(correctiveActions.status, 'pending'));
    const [overdueCount] = await db.select({ count: sql`count(*)` }).from(correctiveActions).where(eq(correctiveActions.status, 'overdue'));

    return {
      complianceRate: Math.round(avgScore),
      openActions: Number(openCount.count),
      overdueActions: Number(overdueCount.count),
      totalAudits: allAudits.length,
    };
  }
}

export const storage = new DatabaseStorage();
