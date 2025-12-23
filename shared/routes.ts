
import { z } from 'zod';
import { insertUserSchema, insertSiteSchema, insertAuditSchema, insertAuditItemSchema, insertCorrectiveActionSchema, users, sites, audits, auditItems, correctiveActions, checklistTemplates } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
  },
  sites: {
    list: {
      method: 'GET' as const,
      path: '/api/sites',
      responses: {
        200: z.array(z.custom<typeof sites.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sites',
      input: insertSiteSchema,
      responses: {
        201: z.custom<typeof sites.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  checklistTemplates: {
    list: {
      method: 'GET' as const,
      path: '/api/checklist-templates',
      responses: {
        200: z.array(z.custom<typeof checklistTemplates.$inferSelect>()),
      },
    },
  },
  audits: {
    list: {
      method: 'GET' as const,
      path: '/api/audits',
      input: z.object({
        auditorId: z.coerce.number().optional(),
        siteId: z.coerce.number().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof audits.$inferSelect & { site: typeof sites.$inferSelect, auditor: typeof users.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/audits/:id',
      responses: {
        200: z.custom<typeof audits.$inferSelect & { 
          site: typeof sites.$inferSelect, 
          auditor: typeof users.$inferSelect,
          items: (typeof auditItems.$inferSelect & { 
            template: typeof checklistTemplates.$inferSelect, 
            correctiveActions: typeof correctiveActions.$inferSelect[] 
          })[] 
        }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/audits',
      input: insertAuditSchema,
      responses: {
        201: z.custom<typeof audits.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/audits/:id',
      input: insertAuditSchema.partial(),
      responses: {
        200: z.custom<typeof audits.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  auditItems: {
    update: {
      method: 'PATCH' as const,
      path: '/api/audit-items/:id',
      input: insertAuditItemSchema.partial(),
      responses: {
        200: z.custom<typeof auditItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  correctiveActions: {
    list: {
      method: 'GET' as const,
      path: '/api/corrective-actions',
      input: z.object({
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof correctiveActions.$inferSelect & { auditItem: typeof auditItems.$inferSelect & { audit: typeof audits.$inferSelect & { site: typeof sites.$inferSelect } } }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/corrective-actions',
      input: insertCorrectiveActionSchema,
      responses: {
        201: z.custom<typeof correctiveActions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/corrective-actions/:id',
      input: insertCorrectiveActionSchema.partial(),
      responses: {
        200: z.custom<typeof correctiveActions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  stats: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/stats/dashboard',
      responses: {
        200: z.object({
          complianceRate: z.number(),
          openActions: z.number(),
          overdueActions: z.number(),
          recentAudits: z.array(z.custom<typeof audits.$inferSelect>()),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
