
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertAuditSchema, insertAuditItemSchema, insertCorrectiveActionSchema, insertSiteSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Setup Object Storage
  registerObjectStorageRoutes(app);

  // Seed data on startup
  await storage.seedChecklistTemplates();

  // Helper to create initial user if needed (simplified)
  // In real app, Replit Auth handles user creation, we just sync profiles

  // === API ROUTES ===

  // Users
  app.get(api.users.me.path, async (req, res) => {
    // For now, mock a user or return the first user
    // In production with Replit Auth, use req.user
    // Mock user for MVP:
    let user = await storage.getUserByUsername("auditor1");
    if (!user) {
      user = await storage.createUser({ username: "auditor1", email: "auditor@example.com", name: "John Doe", role: "auditor" });
      // Also create an admin
      await storage.createUser({ username: "admin1", email: "admin@example.com", name: "Admin User", role: "admin" });
    }
    res.json(user);
  });

  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  // Sites
  app.get(api.sites.list.path, async (req, res) => {
    const sites = await storage.getSites();
    if (sites.length === 0) {
      // Seed sites
      await storage.createSite({ name: "Cape Town Factory", location: "Cape Town", industry: "Manufacturing" });
      await storage.createSite({ name: "Johannesburg Mine", location: "Johannesburg", industry: "Mining" });
    }
    res.json(await storage.getSites());
  });

  app.post(api.sites.create.path, async (req, res) => {
    try {
      const input = insertSiteSchema.parse(req.body);
      const site = await storage.createSite(input);
      res.status(201).json(site);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Templates
  app.get(api.checklistTemplates.list.path, async (req, res) => {
    const templates = await storage.getChecklistTemplates();
    res.json(templates);
  });

  // Audits
  app.get(api.audits.list.path, async (req, res) => {
    const audits = await storage.getAudits();
    res.json(audits);
  });

  app.get(api.audits.get.path, async (req, res) => {
    const audit = await storage.getAudit(Number(req.params.id));
    if (!audit) return res.status(404).json({ message: "Audit not found" });
    res.json(audit);
  });

  app.post(api.audits.create.path, async (req, res) => {
    try {
      const input = insertAuditSchema.parse(req.body);
      const audit = await storage.createAudit(input);
      res.status(201).json(audit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.audits.update.path, async (req, res) => {
    try {
      const input = insertAuditSchema.partial().parse(req.body);
      const audit = await storage.updateAudit(Number(req.params.id), input);
      res.json(audit);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Audit Items
  app.patch(api.auditItems.update.path, async (req, res) => {
    try {
      const input = insertAuditItemSchema.partial().parse(req.body);
      const item = await storage.updateAuditItem(Number(req.params.id), input);
      
      // Recalculate audit score if needed (simplified: do it on audit completion)
      
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Corrective Actions
  app.get(api.correctiveActions.list.path, async (req, res) => {
    const actions = await storage.getCorrectiveActions();
    res.json(actions);
  });

  app.post(api.correctiveActions.create.path, async (req, res) => {
    try {
      const input = insertCorrectiveActionSchema.parse(req.body);
      const action = await storage.createCorrectiveAction(input);
      res.status(201).json(action);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.correctiveActions.update.path, async (req, res) => {
    try {
      const input = insertCorrectiveActionSchema.partial().parse(req.body);
      const action = await storage.updateCorrectiveAction(Number(req.params.id), input);
      res.json(action);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Stats
  app.get(api.stats.dashboard.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    // Fetch recent audits too
    const recentAudits = (await storage.getAudits()).slice(0, 5);
    res.json({ ...stats, recentAudits });
  });

  return httpServer;
}
