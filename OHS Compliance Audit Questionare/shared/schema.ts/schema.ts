// shared/schema.ts - Complete Database Schema for Safety Audit App
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  varchar, 
  integer, 
  boolean, 
  jsonb,
  date,
  numeric,
  pgEnum
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===== ENUMS =====
export const auditStatusEnum = pgEnum('audit_status', [
  'draft', 
  'in_progress', 
  'completed', 
  'submitted', 
  'approved',
  'rejected'
]);

export const riskLevelEnum = pgEnum('risk_level', [
  'low', 
  'medium', 
  'high', 
  'critical'
]);

export const findingStatusEnum = pgEnum('finding_status', [
  'compliant',
  'non_compliant', 
  'not_applicable', 
  'observation',
  'corrected_on_site'
]);

export const priorityEnum = pgEnum('priority', [
  'low', 
  'medium', 
  'high', 
  'critical'
]);

export const actionStatusEnum = pgEnum('action_status', [
  'open', 
  'in_progress', 
  'completed', 
  'verified', 
  'overdue',
  'cancelled'
]);

export const signatureRoleEnum = pgEnum('signature_role', [
  'auditor', 
  'site_manager', 
  'safety_officer', 
  'witness',
  'client_representative'
]);

// ===== SITE DETAILS =====
export const siteDetails = pgTable('site_details', {
  // Primary Key
  id: serial('id').primaryKey(),
  auditUuid: varchar('audit_uuid', { length: 100 }).unique().notNull(),
  
  // Basic Audit Information
  auditDate: date('audit_date').notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyAddress: text('company_address'),
  siteLocation: text('site_location').notNull(),
  projectName: varchar('project_name', { length: 255 }),
  auditReference: varchar('audit_reference', { length: 100 }).unique(),
  auditType: varchar('audit_type', { length: 50 }).default('safety'),
  
  // Site Personnel
  siteManager: varchar('site_manager', { length: 255 }),
  siteManagerContact: varchar('site_manager_contact', { length: 50 }),
  siteManagerEmail: varchar('site_manager_email', { length: 255 }),
  
  safetyOfficer: varchar('safety_officer', { length: 255 }),
  safetyOfficerEmail: varchar('safety_officer_email', { length: 255 }).notNull(),
  safetyOfficerPhone: varchar('safety_officer_phone', { length: 50 }),
  safetyOfficerLicense: varchar('safety_officer_license', { length: 100 }),
  
  // Auditor Information
  auditorName: varchar('auditor_name', { length: 255 }).notNull(),
  auditorEmail: varchar('auditor_email', { length: 255 }).notNull(),
  auditorPhone: varchar('auditor_phone', { length: 50 }).notNull(),
  auditorCompany: varchar('auditor_company', { length: 255 }),
  auditorLicense: varchar('auditor_license', { length: 100 }),
  auditorSignature: text('auditor_signature'),
  
  // Audit Status & Scoring
  status: auditStatusEnum('status').default('draft'),
  auditScore: numeric('audit_score', { precision: 5, scale: 2 }).default('0.00'),
  totalScore: numeric('total_score', { precision: 5, scale: 2 }).default('0.00'),
  maxPossibleScore: numeric('max_possible_score', { precision: 5, scale: 2 }).default('100.00'),
  riskLevel: riskLevelEnum('risk_level').default('low'),
  
  // Site Information
  numberOfWorkers: integer('number_of_workers'),
  workDescription: text('work_description'),
  weatherConditions: varchar('weather_conditions', { length: 100 }),
  temperature: varchar('temperature', { length: 50 }),
  siteConditions: text('site_conditions'),
  
  // Location Data
  gpsLatitude: numeric('gps_latitude', { precision: 10, scale: 8 }),
  gpsLongitude: numeric('gps_longitude', { precision: 11, scale: 8 }),
  gpsAccuracy: numeric('gps_accuracy', { precision: 5, scale: 2 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  
  // Attachments
  sitePhotos: jsonb('site_photos').$type<string[]>().default([]),
  documents: jsonb('documents').$type<string[]>().default([]),
  drawings: jsonb('drawings').$type<string[]>().default([]),
  
  // Dates
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  submittedAt: timestamp('submitted_at'),
  approvedAt: timestamp('approved_at'),
  completedAt: timestamp('completed_at'),
  
  // Audit Details
  auditDuration: integer('audit_duration'), // in minutes
  auditScope: text('audit_scope'),
  objectives: text('objectives'),
  standards: jsonb('standards').$type<string[]>().default([]),
  
  // Metadata
  isDeleted: boolean('is_deleted').default(false),
  version: integer('version').default(1),
  previousAuditId: integer('previous_audit_id').references(() => siteDetails.id),
  nextAuditDate: date('next_audit_date'),
  
  // Custom Fields
  customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),
});

// ===== AUDIT CATEGORIES =====
export const auditCategories = pgTable('audit_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }).default('📋'),
  color: varchar('color', { length: 20 }).default('#3B82F6'),
  weight: integer('weight').default(1),
  order: integer('order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ===== CHECKLIST ITEMS =====
export const checklistItems = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => auditCategories.id, { onDelete: 'cascade' }).notNull(),
  
  // Question Details
  question: text('question').notNull(),
  description: text('description'),
  helpText: text('help_text'),
  reference: text('reference'),
  regulation: varchar('regulation', { length: 100 }),
  
  // Scoring & Risk
  points: integer('points').default(1),
  maxPoints: integer('max_points').default(1),
  severity: riskLevelEnum('severity').default('medium'),
  isCritical: boolean('is_critical').default(false),
  isMandatory: boolean('is_mandatory').default(false),
  
  // Display & Order
  order: integer('order').default(0),
  isActive: boolean('is_active').default(true),
  requiresPhoto: boolean('requires_photo').default(false),
  requiresComment: boolean('requires_comment').default(false),
  
  // Options (for multiple choice questions)
  options: jsonb('options').$type<Array<{ label: string, value: string, points: number }>>().default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ===== AUDIT FINDINGS =====
export const auditFindings = pgTable('audit_findings', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').references(() => siteDetails.id, { onDelete: 'cascade' }).notNull(),
  checklistItemId: integer('checklist_item_id').references(() => checklistItems.id),
  
  // Finding Status
  status: findingStatusEnum('status').notNull(),
  
  // For Non-Compliant Items
  findingDescription: text('finding_description'),
  evidence: text('evidence'),
  rootCause: text('root_cause'),
  immediateAction: text('immediate_action'),
  immediateActionTaken: boolean('immediate_action_taken').default(false),
  
  // Responsibility & Timeline
  responsiblePerson: varchar('responsible_person', { length: 255 }),
  responsiblePersonEmail: varchar('responsible_person_email', { length: 255 }),
  dueDate: date('due_date'),
  
  // Scoring
  pointsAwarded: integer('points_awarded'),
  comments: text('comments'),
  auditorNotes: text('auditor_notes'),
  
  // Attachments
  photos: jsonb('photos').$type<string[]>().default([]),
  documents: jsonb('documents').$type<string[]>().default([]),
  
  // Location Specific
  location: varchar('location', { length: 255 }),
  equipment: varchar('equipment', { length: 255 }),
  personsInvolved: jsonb('persons_involved').$type<string[]>().default([]),
  
  // Dates
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  correctedAt: timestamp('corrected_at'),
  
  // Metadata
  isVerified: boolean('is_verified').default(false),
  verifiedBy: varchar('verified_by', { length: 255 }),
  verificationDate: timestamp('verification_date'),
});

// ===== ACTION ITEMS =====
export const actionItems = pgTable('action_items', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').references(() => siteDetails.id, { onDelete: 'cascade' }).notNull(),
  findingId: integer('finding_id').references(() => auditFindings.id),
  
  // Basic Info
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  referenceNumber: varchar('reference_number', { length: 50 }),
  
  // Assignment
  assignedTo: varchar('assigned_to', { length: 255 }).notNull(),
  assignedEmail: varchar('assigned_email', { length: 255 }).notNull(),
  assignedPhone: varchar('assigned_phone', { length: 50 }),
  assignedCompany: varchar('assigned_company', { length: 255 }),
  
  // Status
  priority: priorityEnum('priority').default('medium'),
  status: actionStatusEnum('status').default('open'),
  
  // Dates
  dueDate: date('due_date').notNull(),
  assignedDate: timestamp('assigned_date').defaultNow(),
  startedDate: timestamp('started_date'),
  completedDate: timestamp('completed_date'),
  verifiedDate: timestamp('verified_date'),
  
  // Verification
  verifiedBy: varchar('verified_by', { length: 255 }),
  verificationNotes: text('verification_notes'),
  verificationPhotos: jsonb('verification_photos').$type<string[]>().default([]),
  
  // Cost & Resources
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: numeric('actual_cost', { precision: 10, scale: 2 }),
  resourcesRequired: text('resources_required'),
  
  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: varchar('recurrence_pattern', { length: 50 }),
  nextDueDate: date('next_due_date'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ===== SIGNATURES =====
export const signatures = pgTable('signatures', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').references(() => siteDetails.id, { onDelete: 'cascade' }).notNull(),
  
  role: signatureRoleEnum('role').notNull(),
  
  // Signature Details
  name: varchar('name', { length: 255 }).notNull(),
  signature: text('signature'), // Base64 encoded signature
  signatureImage: text('signature_image'), // Alternative image storage
  signedAt: timestamp('signed_at').defaultNow(),
  
  // Additional Info
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  position: varchar('position', { length: 255 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  
  // Technical Info
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  deviceInfo: text('device_info'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// ===== AUDIT TEMPLATES =====
export const auditTemplates = pgTable('audit_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('safety'),
  industry: varchar('industry', { length: 100 }),
  
  // Template Configuration
  categories: jsonb('categories').$type<number[]>().default([]), // Array of category IDs
  isPublic: boolean('is_public').default(false),
  isActive: boolean('is_active').default(true),
  
  // Metadata
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  version: integer('version').default(1),
  usedCount: integer('used_count').default(0),
});

// ===== AUDIT COMMENTS =====
export const auditComments = pgTable('audit_comments', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').references(() => siteDetails.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 255 }),
  
  // Comment Details
  comment: text('comment').notNull(),
  type: varchar('type', { length: 50 }).default('general'),
  
  // Attachments
  attachments: jsonb('attachments').$type<string[]>().default([]),
  
  // Mentions
  mentionedUsers: jsonb('mentioned_users').$type<string[]>().default([]),
  
  // Status
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: varchar('resolved_by', { length: 255 }),
  resolvedAt: timestamp('resolved_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ===== USER NOTIFICATIONS =====
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  auditId: integer('audit_id').references(() => siteDetails.id, { onDelete: 'cascade' }),
  
  // Notification Details
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).default('info'),
  
  // Status
  isRead: boolean('is_read').default(false),
  isArchived: boolean('is_archived').default(false),
  
  // Action
  actionUrl: text('action_url'),
  actionLabel: varchar('action_label', { length: 100 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at'),
});

// ===== ZOD VALIDATION SCHEMAS =====

// Site Details Schema
export const insertSiteDetailsSchema = createInsertSchema(siteDetails, {
  companyName: z.string().min(1, "Company name is required"),
  siteLocation: z.string().min(1, "Site location is required"),
  auditDate: z.string().or(z.date()),
  auditorName: z.string().min(1, "Auditor name is required"),
  auditorEmail: z.string().email("Valid email required"),
  auditorPhone: z.string().min(1, "Auditor phone is required"),
  safetyOfficerEmail: z.string().email("Valid safety officer email required"),
  status: z.enum(['draft', 'in_progress', 'completed', 'submitted', 'approved', 'rejected']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  auditScore: z.string().regex(/^\d+(\.\d{1,2})?$/).or(z.number()),
  gpsLatitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional().or(z.number().optional()),
  gpsLongitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional().or(z.number().optional()),
});

export const selectSiteDetailsSchema = createSelectSchema(siteDetails);

// Finding Schema
export const insertAuditFindingSchema = createInsertSchema(auditFindings, {
  status: z.enum(['compliant', 'non_compliant', 'not_applicable', 'observation', 'corrected_on_site']),
  pointsAwarded: z.number().int().min(0).optional(),
});

// Action Item Schema
export const insertActionItemSchema = createInsertSchema(actionItems, {
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  assignedTo: z.string().min(1, "Assigned person is required"),
  assignedEmail: z.string().email("Valid email required"),
  dueDate: z.string().or(z.date()),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'completed', 'verified', 'overdue', 'cancelled']),
});

// Signature Schema
export const insertSignatureSchema = createInsertSchema(signatures, {
  role: z.enum(['auditor', 'site_manager', 'safety_officer', 'witness', 'client_representative']),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required").optional(),
});

// ===== TYPES =====
export type SiteDetails = typeof siteDetails.$inferSelect;
export type InsertSiteDetails = typeof siteDetails.$inferInsert;

export type AuditCategory = typeof auditCategories.$inferSelect;
export type InsertAuditCategory = typeof auditCategories.$inferInsert;

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

export type AuditFinding = typeof auditFindings.$inferSelect;
export type InsertAuditFinding = typeof auditFindings.$inferInsert;

export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = typeof actionItems.$inferInsert;

export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = typeof signatures.$inferInsert;

export type AuditTemplate = typeof auditTemplates.$inferSelect;
export type InsertAuditTemplate = typeof auditTemplates.$inferInsert;

export type AuditComment = typeof auditComments.$inferSelect;
export type InsertAuditComment = typeof auditComments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ===== DEFAULT SEED DATA =====
export const defaultCategories = [
  {
    name: 'Site Access & Setup',
    description: 'Site access, pedestrian routes, traffic management',
    icon: '🚧',
    color: '#F59E0B',
    weight: 15,
    order: 1
  },
  {
    name: 'PPE Compliance',
    description: 'Personal Protective Equipment requirements and usage',
    icon: '👷',
    color: '#10B981',
    weight: 20,
    order: 2
  },
  {
    name: 'Electrical Safety',
    description: 'Electrical installations, tools, and equipment safety',
    icon: '⚡',
    color: '#EF4444',
    weight: 25,
    order: 3
  },
  {
    name: 'Fire Safety',
    description: 'Fire prevention, detection, and fighting equipment',
    icon: '🔥',
    color: '#DC2626',
    weight: 15,
    order: 4
  },
  {
    name: 'Working at Height',
    description: 'Scaffolding, ladders, fall protection systems',
    icon: '🪜',
    color: '#8B5CF6',
    weight: 20,
    order: 5
  },
  {
    name: 'Equipment & Machinery',
    description: 'Tools, machinery, and equipment safety',
    icon: '🔧',
    color: '#6366F1',
    weight: 15,
    order: 6
  },
  {
    name: 'Housekeeping',
    description: 'Site cleanliness, waste management, storage',
    icon: '🧹',
    color: '#EC4899',
    weight: 10,
    order: 7
  },
  {
    name: 'First Aid & Welfare',
    description: 'First aid facilities, welfare arrangements',
    icon: '🏥',
    color: '#3B82F6',
    weight: 10,
    order: 8
  }
];

// Example checklist items for PPE category
export const ppeChecklistItems = [
  {
    question: 'Are all workers wearing appropriate safety helmets?',
    description: 'Check for proper use of safety helmets in designated areas',
    points: 2,
    severity: 'high',
    isCritical: true,
    requiresPhoto: true
  },
  {
    question: 'Are safety shoes/boots being worn as required?',
    description: 'Check for appropriate footwear in work areas',
    points: 2,
    severity: 'medium',
    requiresPhoto: false
  },
  {
    question: 'Is high-visibility clothing worn in traffic areas?',
    description: 'Verify hi-vis clothing in vehicle movement areas',
    points: 1,
    severity: 'medium',
    requiresPhoto: true
  },
  {
    question: 'Are appropriate gloves worn for the task being performed?',
    description: 'Check glove usage for specific tasks',
    points: 1,
    severity: 'low',
    requiresPhoto: false
  }
];