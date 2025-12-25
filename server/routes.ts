import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertAuditSchema, insertAuditItemSchema, insertCorrectiveActionSchema, insertSiteSchema, insertAuditApprovalSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/auth/object_storage";
import PDFDocument from "pdfkit";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  // Seed templates
  await storage.seedChecklistTemplates();

  // === API ROUTES ===

  app.get("/api/user", async (req, res) => {
    let user = await storage.getUserByUsername("auditor1");
    if (!user) {
      user = await storage.createUser({ username: "auditor1", email: "auditor@example.com", name: "John Doe", role: "auditor" });
      await storage.createUser({ username: "admin1", email: "admin@example.com", name: "Admin User", role: "admin" });
    }
    res.json(user);
  });

  app.get("/api/users", async (req, res) => {
    res.json(await storage.getUsers());
  });

  app.get("/api/sites", async (req, res) => {
    let sites = await storage.getSites();
    if (sites.length === 0) {
      await storage.createSite({ name: "Cape Town Factory", location: "Cape Town", industry: "Manufacturing" });
      await storage.createSite({ name: "Johannesburg Mine", location: "Johannesburg", industry: "Mining" });
      sites = await storage.getSites();
    }
    res.json(sites);
  });

  app.post("/api/sites", async (req, res) => {
    try {
      const input = insertSiteSchema.parse(req.body);
      res.status(201).json(await storage.createSite(input));
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get("/api/checklist-templates", async (req, res) => {
    res.json(await storage.getChecklistTemplates());
  });

  app.get("/api/audits", async (req, res) => {
    res.json(await storage.getAudits());
  });

  app.get("/api/audits/:id", async (req, res) => {
    const audit = await storage.getAudit(Number(req.params.id));
    if (!audit) return res.status(404).json({ message: "Not found" });
    res.json(audit);
  });

  app.post("/api/audits", async (req, res) => {
    try {
      const input = insertAuditSchema.parse(req.body);
      res.status(201).json(await storage.createAudit(input));
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.patch("/api/audits/:id", async (req, res) => {
    try {
      const input = insertAuditSchema.partial().parse(req.body);
      res.json(await storage.updateAudit(Number(req.params.id), input));
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Auto-save draft
  app.post("/api/audits/:id/draft", async (req, res) => {
    try {
      await storage.updateAudit(Number(req.params.id), { draftData: JSON.stringify(req.body) });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Error saving draft" });
    }
  });

  app.patch("/api/audit-items/:id", async (req, res) => {
    try {
      const input = insertAuditItemSchema.partial().parse(req.body);
      res.json(await storage.updateAuditItem(Number(req.params.id), input));
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get("/api/corrective-actions", async (req, res) => {
    res.json(await storage.getCorrectiveActions());
  });

  app.post("/api/corrective-actions", async (req, res) => {
    try {
      const input = insertCorrectiveActionSchema.parse(req.body);
      res.status(201).json(await storage.createCorrectiveAction(input));
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.patch("/api/corrective-actions/:id", async (req, res) => {
    try {
      const input = insertCorrectiveActionSchema.partial().parse(req.body);
      res.json(await storage.updateCorrectiveAction(Number(req.params.id), input));
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Audit Approvals
  app.post("/api/audits/:id/approvals", async (req, res) => {
    try {
      const input = insertAuditApprovalSchema.parse(req.body);
      const approval = await storage.createAuditApproval({ ...input, auditId: Number(req.params.id) });
      // Auto-update audit status if approved
      if (approval.status === "approved") {
        await storage.updateAudit(Number(req.params.id), { status: "completed" });
      }
      res.status(201).json(approval);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get("/api/audits/:id/approvals", async (req, res) => {
    res.json(await storage.getAuditApprovals(Number(req.params.id)));
  });

  // PDF Report Generation
  app.get("/api/audits/:id/report", async (req, res) => {
    const audit = await storage.getAudit(Number(req.params.id));
    if (!audit) return res.status(404).json({ message: "Not found" });

    try {
      const doc = new PDFDocument();
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="audit-report-${audit.auditNumber}.pdf"`);

      doc.pipe(res);
      
      // Title
      doc.fontSize(24).font("Helvetica-Bold").text("Safety Audit Report", { align: "center" });
      doc.fontSize(12).font("Helvetica").text(`Audit Number: ${audit.auditNumber}`, { align: "center" });
      doc.moveDown();

      // Header Info
      doc.font("Helvetica-Bold").text("Audit Details");
      doc.font("Helvetica").fontSize(10);
      doc.text(`Date: ${new Date(audit.date).toLocaleDateString()}`);
      doc.text(`Type: ${audit.type}`);
      doc.text(`Status: ${audit.status}`);
      doc.text(`Score: ${audit.score}%`);
      doc.moveDown();

      // Compliance Score
      doc.fontSize(12).font("Helvetica-Bold").text("Compliance Score");
      doc.fontSize(10).font("Helvetica").text(`Overall Compliance: ${audit.score}%`);
      doc.moveDown();

      // Findings Summary
      doc.fontSize(12).font("Helvetica-Bold").text("Findings Summary");
      doc.fontSize(10).font("Helvetica").text("This report summarizes the audit findings based on OHSA, NEMA, and MHSA compliance requirements.");
      doc.moveDown();

      // Recommendations
      doc.fontSize(12).font("Helvetica-Bold").text("Recommendations");
      doc.fontSize(10).font("Helvetica");
      if (audit.score && audit.score < 80) {
        doc.text("- Immediate corrective actions required for non-compliant items");
        doc.text("- Schedule follow-up audit within 30 days");
      } else if (audit.score && audit.score < 95) {
        doc.text("- Continue preventive maintenance programs");
        doc.text("- Recommend annual review");
      } else {
        doc.text("- Maintain current compliance standards");
      }
      doc.moveDown();

      // Footer
      doc.fontSize(8).text(`Report Generated: ${new Date().toLocaleString()}`, { align: "center" });
      
      doc.end();
    } catch (err) {
      res.status(500).json({ message: "Error generating report" });
    }
  });

  // Dashboard Stats
  app.get("/api/stats/dashboard", async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Audit Scoring
  app.post("/api/audits/:id/calculate-score", async (req, res) => {
    try {
      const score = await storage.calculateAuditScore(Number(req.params.id));
      await storage.updateAudit(Number(req.params.id), { score });
      res.json({ score });
    } catch (err) {
      res.status(500).json({ message: "Error calculating score" });
    }
  });

  return httpServer;
}
