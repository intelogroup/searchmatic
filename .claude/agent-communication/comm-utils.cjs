/**
 * Inter-Agent Communication Utilities
 * Provides core functions for agent-to-agent communication via reports
 */

const fs = require('fs');
const path = require('path');

// Configuration
const REPORTS_DIR = '/tmp/agent-reports';
const BROADCASTS_DIR = '/tmp/agent-broadcasts';
const ALERTS_DIR = '/tmp/agent-alerts';

// Ensure directories exist
function ensureDirectories() {
    [REPORTS_DIR, BROADCASTS_DIR, ALERTS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

/**
 * Send a report to other agents
 * @param {Object} report - Agent report object
 */
function sendAgentReport(report) {
    ensureDirectories();
    
    // Validate report structure
    if (!report.sourceAgent || !report.message || report.message.split(' ').length > 50) {
        console.error('Invalid report: missing sourceAgent, message, or message >50 words');
        return;
    }
    
    // Add timestamp and ID if not present
    report.timestamp = report.timestamp || new Date().toISOString();
    report.id = report.id || `${report.sourceAgent}-${Date.now()}`;
    
    // Save report to persistent storage
    const reportPath = path.join(REPORTS_DIR, `${report.timestamp.replace(/[:.]/g, '-')}-${report.sourceAgent}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // If high priority or critical, also broadcast immediately
    if (report.priority === 'high' || report.priority === 'critical') {
        const broadcastPath = path.join(BROADCASTS_DIR, `${report.id}.json`);
        fs.writeFileSync(broadcastPath, JSON.stringify(report, null, 2));
    }
    
    // If critical, create alert
    if (report.priority === 'critical') {
        const alertPath = path.join(ALERTS_DIR, `CRITICAL-${report.id}.json`);
        fs.writeFileSync(alertPath, JSON.stringify({
            ...report,
            alertCreated: new Date().toISOString()
        }, null, 2));
    }
    
    console.log(`📡 Report sent: ${report.message.substring(0, 30)}...`);
}

/**
 * Check for incoming reports relevant to this agent
 * @param {string} agentName - Name of the requesting agent
 * @param {string} maxAge - Maximum age of reports to consider (default: 1 hour)
 * @returns {Array} Array of relevant reports
 */
function checkAgentReports(agentName, maxAge = '1h') {
    ensureDirectories();
    
    const maxAgeMs = parseMaxAge(maxAge);
    const now = Date.now();
    
    try {
        const reportFiles = fs.readdirSync(REPORTS_DIR)
            .filter(file => file.endsWith('.json'))
            .filter(file => !file.includes(agentName)) // Exclude own reports
            .map(file => {
                const filePath = path.join(REPORTS_DIR, file);
                const stat = fs.statSync(filePath);
                return {
                    file: filePath,
                    age: now - stat.mtime.getTime()
                };
            })
            .filter(item => item.age <= maxAgeMs)
            .map(item => {
                try {
                    const content = fs.readFileSync(item.file, 'utf8');
                    return JSON.parse(content);
                } catch (error) {
                    console.error(`Error reading report ${item.file}:`, error);
                    return null;
                }
            })
            .filter(report => report !== null)
            .filter(report => isReportRelevant(report, agentName))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return reportFiles;
    } catch (error) {
        console.error('Error checking agent reports:', error);
        return [];
    }
}

/**
 * Check for immediate broadcasts (high/critical priority)
 * @param {string} agentName - Name of the requesting agent
 * @returns {Array} Array of broadcast reports
 */
function checkBroadcasts(agentName) {
    ensureDirectories();
    
    try {
        const broadcastFiles = fs.readdirSync(BROADCASTS_DIR)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(BROADCASTS_DIR, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const report = JSON.parse(content);
                    
                    // Delete broadcast after reading (consume once)
                    fs.unlinkSync(filePath);
                    
                    return report;
                } catch (error) {
                    console.error(`Error reading broadcast ${file}:`, error);
                    return null;
                }
            })
            .filter(report => report !== null && isReportRelevant(report, agentName));
        
        return broadcastFiles;
    } catch (error) {
        console.error('Error checking broadcasts:', error);
        return [];
    }
}

/**
 * Check for critical alerts
 * @param {string} agentName - Name of the requesting agent
 * @returns {Array} Array of critical alerts
 */
function checkCriticalAlerts(agentName) {
    ensureDirectories();
    
    try {
        const alertFiles = fs.readdirSync(ALERTS_DIR)
            .filter(file => file.startsWith('CRITICAL-') && file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(ALERTS_DIR, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    return JSON.parse(content);
                } catch (error) {
                    console.error(`Error reading alert ${file}:`, error);
                    return null;
                }
            })
            .filter(report => report !== null && isReportRelevant(report, agentName));
        
        return alertFiles;
    } catch (error) {
        console.error('Error checking critical alerts:', error);
        return [];
    }
}

/**
 * Determine if a report is relevant to the given agent
 * @param {Object} report - Report object
 * @param {string} agentName - Name of the agent
 * @returns {boolean} True if relevant
 */
function isReportRelevant(report, agentName) {
    // Always relevant if targeted specifically or to all agents
    if (!report.targetAgents || 
        report.targetAgents.includes(agentName) || 
        report.targetAgents.includes('all')) {
        return true;
    }
    
    // Check stack-based relevance
    const agentStackMap = {
        'database-migration-agent': ['supabase', 'postgres', 'neon', 'convex', 'prisma'],
        'auth-security-agent': ['supabase', 'auth0', 'firebase', 'clerk'],
        'frontend-ui-agent': ['react', 'vue', 'svelte', 'tailwind', 'mui'],
        'testing-qa-agent': ['react', 'vue', 'vitest', 'jest', 'cypress'],
        'deployment-devops-agent': ['netlify', 'vercel', 'railway', 'aws'],
        'performance-optimization-agent': ['react', 'vue', 'svelte'],
        'api-integration-agent': ['fetch', 'supabase', 'external-api']
    };
    
    const agentStacks = agentStackMap[agentName] || [];
    const reportStack = report.context?.stack;
    
    if (reportStack && agentStacks.includes(reportStack)) {
        return true;
    }
    
    // Check category-based relevance
    const categoryRelevance = {
        'warning': ['all'], // Warnings relevant to all
        'critical': ['all'], // Critical issues relevant to all
        'dependency': ['all'], // Dependency issues relevant to all
        'discovery': agentName => {
            // Discoveries relevant to related agents only
            return false; // Let stack-based filtering handle this
        }
    };
    
    return false;
}

/**
 * Parse max age string to milliseconds
 * @param {string} maxAge - Age string like '1h', '30m', '2d'
 * @returns {number} Milliseconds
 */
function parseMaxAge(maxAge) {
    const units = {
        'm': 60 * 1000,           // minutes
        'h': 60 * 60 * 1000,      // hours  
        'd': 24 * 60 * 60 * 1000  // days
    };
    
    const match = maxAge.match(/^(\d+)([mhd])$/);
    if (match) {
        return parseInt(match[1]) * units[match[2]];
    }
    
    // Default to 1 hour
    return 60 * 60 * 1000;
}

/**
 * Clean up old reports and alerts
 * @param {string} maxAge - Maximum age to keep (default: 24h)
 */
function cleanup(maxAge = '24h') {
    const maxAgeMs = parseMaxAge(maxAge);
    const now = Date.now();
    
    [REPORTS_DIR, ALERTS_DIR].forEach(dir => {
        try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (now - stat.mtime.getTime() > maxAgeMs) {
                    fs.unlinkSync(filePath);
                }
            });
        } catch (error) {
            console.error(`Error cleaning up ${dir}:`, error);
        }
    });
}

/**
 * Generate a standardized report object
 * @param {string} sourceAgent - Source agent name
 * @param {string} message - Message (max 50 words)
 * @param {Object} options - Additional options
 * @returns {Object} Formatted report object
 */
function createReport(sourceAgent, message, options = {}) {
    return {
        id: `${sourceAgent}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        sourceAgent: sourceAgent,
        targetAgents: options.targetAgents || ['all'],
        priority: options.priority || 'medium',
        category: options.category || 'discovery',
        message: message,
        context: options.context || {},
        actionRequired: options.actionRequired || false
    };
}

module.exports = {
    sendAgentReport,
    checkAgentReports,
    checkBroadcasts,
    checkCriticalAlerts,
    createReport,
    cleanup,
    ensureDirectories
};