// backend/server.js - Express Backend Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../')); // Serve frontend files

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// ===== API ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SafetyAudit Pro API'
  });
});

// Get all audits
app.get('/api/audits', async (req, res) => {
  try {
    const audits = await db.select().from(schema.siteDetails).where({
      isDeleted: false
    }).orderBy(schema.siteDetails.createdAt);
    res.json(audits);
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// Create new audit
app.post('/api/audits', async (req, res) => {
  try {
    const auditData = req.body;
    auditData.auditUuid = generateAuditUuid();
    
    const [newAudit] = await db.insert(schema.siteDetails)
      .values(auditData)
      .returning();
    
    res.status(201).json(newAudit);
  } catch (error) {
    console.error('Error creating audit:', error);
    res.status(500).json({ error: 'Failed to create audit' });
  }
});

// Get single audit
app.get('/api/audits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [audit] = await db.select().from(schema.siteDetails).where({
      id: parseInt(id),
      isDeleted: false
    });
    
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    
    res.json(audit);
  } catch (error) {
    console.error('Error fetching audit:', error);
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// Update audit
app.put('/api/audits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();
    
    const [updatedAudit] = await db.update(schema.siteDetails)
      .set(updateData)
      .where({ id: parseInt(id) })
      .returning();
    
    res.json(updatedAudit);
  } catch (error) {
    console.error('Error updating audit:', error);
    res.status(500).json({ error: 'Failed to update audit' });
  }
});

// Get audit findings
app.get('/api/audits/:id/findings', async (req, res) => {
  try {
    const { id } = req.params;
    const findings = await db.select().from(schema.auditFindings).where({
      auditId: parseInt(id)
    });
    
    res.json(findings);
  } catch (error) {
    console.error('Error fetching findings:', error);
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

// Create finding
app.post('/api/findings', async (req, res) => {
  try {
    const findingData = req.body;
    const [newFinding] = await db.insert(schema.auditFindings)
      .values(findingData)
      .returning();
    
    res.status(201).json(newFinding);
  } catch (error) {
    console.error('Error creating finding:', error);
    res.status(500).json({ error: 'Failed to create finding' });
  }
});

// Get checklist categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.select().from(schema.auditCategories)
      .where({ isActive: true })
      .orderBy(schema.auditCategories.order);
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get checklist items by category
app.get('/api/categories/:categoryId/items', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const items = await db.select().from(schema.checklistItems)
      .where({ 
        categoryId: parseInt(categoryId),
        isActive: true 
      })
      .orderBy(schema.checklistItems.order);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching checklist items:', error);
    res.status(500).json({ error: 'Failed to fetch checklist items' });
  }
});

// Create action item
app.post('/api/action-items', async (req, res) => {
  try {
    const actionData = req.body;
    const [newAction] = await db.insert(schema.actionItems)
      .values(actionData)
      .returning();
    
    res.status(201).json(newAction);
  } catch (error) {
    console.error('Error creating action item:', error);
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

// Get audit statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalAudits = await db.select({ count: schema.siteDetails.id })
      .from(schema.siteDetails)
      .where({ isDeleted: false });
    
    const completedAudits = await db.select({ count: schema.siteDetails.id })
      .from(schema.siteDetails)
      .where({ 
        isDeleted: false,
        status: 'completed'
      });
    
    const pendingActions = await db.select({ count: schema.actionItems.id })
      .from(schema.actionItems)
      .where({ 
        status: 'open'
      });
    
    res.json({
      totalAudits: totalAudits[0]?.count || 0,
      completedAudits: completedAudits[0]?.count || 0,
      pendingActions: pendingActions[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// File upload endpoint
app.post('/api/upload', async (req, res) => {
  try {
    // In a real implementation, you would handle file uploads here
    // This is a simplified version
    const { fileName, fileType, base64Data } = req.body;
    
    // Generate unique filename
    const uniqueFileName = `${Date.now()}-${fileName}`;
    
    // In production, you would save to cloud storage
    // For Replit, you can use their file system or S3 integration
    
    res.json({
      success: true,
      fileName: uniqueFileName,
      url: `/uploads/${uniqueFileName}` // This would be the actual URL
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Generate PDF report
app.post('/api/audits/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;
    
    // In a real implementation, generate PDF using a library like pdfkit
    // This is a placeholder response
    res.json({
      success: true,
      message: `Report generated for audit ${id}`,
      downloadUrl: `/api/audits/${id}/report.pdf`,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Helper function
function generateAuditUuid() {
  return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Start server
app.listen(port, () => {
  console.log(`🚀 SafetyAudit Pro backend running on port ${port}`);
  console.log(`📊 Database connected: ${connectionString ? 'Yes' : 'No'}`);
  console.log(`🌐 Frontend available at: http://localhost:${port}`);
});