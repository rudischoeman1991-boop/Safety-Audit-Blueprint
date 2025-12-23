// ==============================================
// SAFETYAUDIT PRO - Backend Server
// ==============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Sample audit data storage (in production, use database)
let auditDataStore = {};

// ===== API ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'SafetyAudit Pro API'
    });
});

// Save site details
app.post('/api/site-details', (req, res) => {
    try {
        const { auditId, data } = req.body;
        
        if (!auditId || !data) {
            return res.status(400).json({ error: 'Missing auditId or data' });
        }
        
        if (!auditDataStore[auditId]) {
            auditDataStore[auditId] = {};
        }
        
        auditDataStore[auditId].siteDetails = {
            ...data,
            updatedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        res.json({ 
            success: true, 
            message: 'Site details saved successfully',
            auditId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving site details:', error);
        res.status(500).json({ error: 'Failed to save site details' });
    }
});

// Get site details
app.get('/api/site-details/:auditId', (req, res) => {
    try {
        const { auditId } = req.params;
        const data = auditDataStore[auditId]?.siteDetails;
        
        if (!data) {
            return res.status(404).json({ error: 'Audit not found' });
        }
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error getting site details:', error);
        res.status(500).json({ error: 'Failed to get site details' });
    }
});

// Save checklist
app.post('/api/checklist', (req, res) => {
    try {
        const { auditId, items } = req.body;
        
        if (!auditId || !items) {
            return res.status(400).json({ error: 'Missing auditId or items' });
        }
        
        if (!auditDataStore[auditId]) {
            auditDataStore[auditId] = {};
        }
        
        auditDataStore[auditId].checklist = items;
        
        // Calculate statistics
        const totalItems = items.length;
        const compliantItems = items.filter(item => item.response === 'compliant').length;
        const complianceRate = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;
        
        res.json({ 
            success: true, 
            message: 'Checklist saved successfully',
            statistics: {
                totalItems,
                compliantItems,
                complianceRate,
                nonCompliantItems: totalItems - compliantItems
            }
        });
    } catch (error) {
        console.error('Error saving checklist:', error);
        res.status(500).json({ error: 'Failed to save checklist' });
    }
});

// Save photo (simplified - in production, use file storage)
app.post('/api/photos', (req, res) => {
    try {
        const { auditId, photo } = req.body;
        
        if (!auditId || !photo) {
            return res.status(400).json({ error: 'Missing auditId or photo data' });
        }
        
        if (!auditDataStore[auditId]) {
            auditDataStore[auditId] = {};
        }
        
        if (!auditDataStore[auditId].photos) {
            auditDataStore[auditId].photos = [];
        }
        
        const photoId = Date.now();
        auditDataStore[auditId].photos.push({
            id: photoId,
            ...photo,
            uploadedAt: new Date().toISOString()
        });
        
        res.json({ 
            success: true, 
            message: 'Photo saved successfully',
            photoId
        });
    } catch (error) {
        console.error('Error saving photo:', error);
        res.status(500).json({ error: 'Failed to save photo' });
    }
});

// Get audit summary
app.get('/api/audit/:auditId/summary', (req, res) => {
    try {
        const { auditId } = req.params;
        const data = auditDataStore[auditId];
        
        if (!data) {
            return res.status(404).json({ error: 'Audit not found' });
        }
        
        const summary = {
            siteDetails: data.siteDetails || {},
            checklistCount: data.checklist?.length || 0,
            photoCount: data.photos?.length || 0,
            lastUpdated: data.siteDetails?.updatedAt || new Date().toISOString(),
            status: data.siteDetails?.status || 'draft'
        };
        
        res.json({ success: true, summary });
    } catch (error) {
        console.error('Error getting audit summary:', error);
        res.status(500).json({ error: 'Failed to get audit summary' });
    }
});

// List all audits
app.get('/api/audits', (req, res) => {
    try {
        const audits = Object.entries(auditDataStore).map(([auditId, data]) => ({
            auditId,
            companyName: data.siteDetails?.companyName || 'Unknown',
            auditDate: data.siteDetails?.auditDate || 'Unknown',
            status: data.siteDetails?.status || 'draft',
            lastUpdated: data.siteDetails?.updatedAt || new Date().toISOString(),
            complianceRate: data.checklist ? 
                Math.round((data.checklist.filter(item => item.response === 'compliant').length / data.checklist.length) * 100) : 0
        }));
        
        res.json({ success: true, audits });
    } catch (error) {
        console.error('Error listing audits:', error);
        res.status(500).json({ error: 'Failed to list audits' });
    }
});

// Generate PDF report (simplified)
app.post('/api/generate-report', (req, res) => {
    try {
        const { auditId } = req.body;
        
        if (!auditId) {
            return res.status(400).json({ error: 'Missing auditId' });
        }
        
        const data = auditDataStore[auditId];
        
        if (!data) {
            return res.status(404).json({ error: 'Audit not found' });
        }
        
        // In production, use PDF generation library like pdfkit
        const report = {
            auditId,
            generatedAt: new Date().toISOString(),
            title: `Safety Audit Report - ${data.siteDetails?.companyName || 'Unknown Company'}`,
            summary: {
                company: data.siteDetails?.companyName,
                auditDate: data.siteDetails?.auditDate,
                siteManager: data.siteDetails?.siteManager,
                safetyOfficer: data.siteDetails?.safetyOfficer,
                auditor: data.siteDetails?.auditorName,
                complianceRate: data.checklist ? 
                    Math.round((data.checklist.filter(item => item.response === 'compliant').length / data.checklist.length) * 100) : 0,
                totalFindings: data.checklist?.filter(item => item.response === 'non_compliant').length || 0
            },
            checklist: data.checklist || [],
            findings: data.findings || []
        };
        
        res.json({ 
            success: true, 
            message: 'Report generated successfully',
            report,
            downloadUrl: `/api/reports/${auditId}.pdf` // In production, generate actual PDF
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ========================================
    🚀 SafetyAudit Pro Server Started!
    ========================================
    📍 Local: http://localhost:${PORT}
    📍 Network: http://${getIPAddress()}:${PORT}
    
    📊 Health Check: http://localhost:${PORT}/api/health
    📝 API Documentation: Available at /api-docs
    💾 Database: Ready for connections
    
    Press Ctrl+C to stop the server
    ========================================
    `);
});

// Helper function to get IP address
function getIPAddress() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});