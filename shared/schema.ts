import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";
export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  replitId: text("replit_id").unique(),
  username: text("username").notNull().unique(),
  email: text("email"),
  name: text("name"),
  role: text("role").default("auditor").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  industry: text("industry").notNull(),
  riskProfile: text("risk_profile").default("medium"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow(),
});

export const checklistTemplates = pgTable("checklist_templates", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  legislation: text("legislation").notNull(), // OHSA, NEMA, MHSA, DMR, EIR, HCS, GSR, ERW
  itemNumber: text("item_number").notNull(),
  description: text("description").notNull(),
  regulationReference: text("regulation_reference").notNull(),
  riskLevel: text("risk_level").default("medium"),
  applicableIndustries: text("applicable_industries").array(),
});

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  auditNumber: text("audit_number").unique().notNull(),
  siteId: integer("site_id").references(() => sites.id).notNull(),
  auditorId: integer("auditor_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // Routine, Follow-up, Incident
  status: text("status").default("draft").notNull(), // draft, in_progress, pending_approval, completed
  score: integer("score"),
  scheduledDate: timestamp("scheduled_date"),
  approvalNotes: text("approval_notes"),
  approvedById: integer("approved_by_id").references(() => users.id),
  draftData: text("draft_data"), // JSON for auto-save
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditItems = pgTable("audit_items", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").references(() => audits.id).notNull(),
  checklistTemplateId: integer("checklist_template_id").references(() => checklistTemplates.id).notNull(),
  status: text("status").notNull(), // compliant, non_compliant, n/a, pending
  notes: text("notes"),
  photoUrl: text("photo_url"),
  riskAssessment: text("risk_assessment"), // JSON: {probability, severity, mitigationRequired}
});

export const correctiveActions = pgTable("corrective_actions", {
  id: serial("id").primaryKey(),
  auditItemId: integer("audit_item_id").references(() => auditItems.id).notNull(),
  description: text("description").notNull(),
  riskLevel: text("risk_level").notNull(), // low, medium, high
  assignedToId: integer("assigned_to_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  status: text("status").default("pending").notNull(), // pending, in_progress, completed, overdue
  completedAt: timestamp("completed_at"),
  approvalStatus: text("approval_status").default("pending"), // pending, approved, rejected
});

export const auditApprovals = pgTable("audit_approvals", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").references(() => audits.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  status: text("status").notNull(), // pending, approved, rejected
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  audits: many(audits),
  assignedActions: many(correctiveActions),
  approvals: many(auditApprovals),
}));

export const sitesRelations = relations(sites, ({ many }) => ({
  audits: many(audits),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  site: one(sites, { fields: [audits.siteId], references: [sites.id] }),
  auditor: one(users, { fields: [audits.auditorId], references: [users.id] }),
  approvedBy: one(users, { fields: [audits.approvedById], references: [users.id] }),
  items: many(auditItems),
  approvals: many(auditApprovals),
}));

export const auditItemsRelations = relations(auditItems, ({ one, many }) => ({
  audit: one(audits, { fields: [auditItems.auditId], references: [audits.id] }),
  template: one(checklistTemplates, { fields: [auditItems.checklistTemplateId], references: [checklistTemplates.id] }),
  correctiveActions: many(correctiveActions),
}));

export const correctiveActionsRelations = relations(correctiveActions, ({ one }) => ({
  auditItem: one(auditItems, { fields: [correctiveActions.auditItemId], references: [auditItems.id] }),
  assignedTo: one(users, { fields: [correctiveActions.assignedToId], references: [users.id] }),
}));

export const auditApprovalsRelations = relations(auditApprovals, ({ one }) => ({
  audit: one(audits, { fields: [auditApprovals.auditId], references: [audits.id] }),
  reviewer: one(users, { fields: [auditApprovals.reviewerId], references: [users.id] }),
}));

// === SCHEMAS & TYPES ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSiteSchema = createInsertSchema(sites).omit({ id: true, createdAt: true });
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true, createdAt: true, score: true, auditNumber: true });
export const insertAuditItemSchema = createInsertSchema(auditItems).omit({ id: true });
export const insertCorrectiveActionSchema = createInsertSchema(correctiveActions).omit({ id: true, completedAt: true });
export const insertAuditApprovalSchema = createInsertSchema(auditApprovals).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type AuditItem = typeof auditItems.$inferSelect;
export type InsertAuditItem = z.infer<typeof insertAuditItemSchema>;
export type CorrectiveAction = typeof correctiveActions.$inferSelect;
export type InsertCorrectiveAction = z.infer<typeof insertCorrectiveActionSchema>;
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;
export type AuditApproval = typeof auditApprovals.$inferSelect;
export type InsertAuditApproval = z.infer<typeof insertAuditApprovalSchema>;
