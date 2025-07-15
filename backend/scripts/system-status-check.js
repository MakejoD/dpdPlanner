// Final comprehensive status check for the entire dpdPlanner system
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

class SystemStatusCheck {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  log(message, type = 'info', category = 'SYSTEM') {
    const timestamp = new Date().toISOString();
    this.results.push({ timestamp, message, type, category });
    
    const symbols = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const categoryColors = {
      AUTH: '🔐',
      API: '🌐',
      DATA: '💾',
      APPROVAL: '✅',
      SYSTEM: '⚙️'
    };
    
    console.log(`${categoryColors[category] || '⚙️'} ${symbols[type] || 'ℹ️'} ${message}`);
  }

  async checkAuthentication() {
    try {
      this.log('Testing authentication system...', 'info', 'AUTH');
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@poa.gov',
        password: 'admin123'
      });

      if (response.data.token) {
        this.authToken = response.data.token;
        this.log('Authentication system working correctly', 'success', 'AUTH');
        return true;
      } else {
        this.log('Authentication failed - no token received', 'error', 'AUTH');
        return false;
      }
    } catch (error) {
      this.log(`Authentication error: ${error.message}`, 'error', 'AUTH');
      return false;
    }
  }

  async checkCoreAPIs() {
    if (!this.authToken) {
      this.log('Cannot test APIs without authentication', 'error', 'API');
      return false;
    }

    const headers = { Authorization: `Bearer ${this.authToken}` };
    const endpoints = [
      { path: '/users', name: 'Users API' },
      { path: '/departments', name: 'Departments API' },
      { path: '/roles', name: 'Roles API' },
      { path: '/strategic-axes', name: 'Strategic Axes API' },
      { path: '/objectives', name: 'Objectives API' },
      { path: '/products', name: 'Products API' },
      { path: '/activities', name: 'Activities API' },
      { path: '/budget-execution', name: 'Budget Execution API' }
    ];

    let successCount = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE}${endpoint.path}`, { headers });
        if (response.status === 200) {
          this.log(`${endpoint.name} - Working correctly`, 'success', 'API');
          successCount++;
        } else {
          this.log(`${endpoint.name} - Unexpected status: ${response.status}`, 'warning', 'API');
        }
      } catch (error) {
        this.log(`${endpoint.name} - Error: ${error.message}`, 'error', 'API');
      }
    }

    const successRate = (successCount / endpoints.length) * 100;
    this.log(`Core APIs Status: ${successCount}/${endpoints.length} working (${successRate.toFixed(1)}%)`, 
             successRate === 100 ? 'success' : 'warning', 'API');
    
    return successRate >= 80;
  }

  async checkApprovalSystem() {
    if (!this.authToken) {
      this.log('Cannot test Approval System without authentication', 'error', 'APPROVAL');
      return false;
    }

    const headers = { Authorization: `Bearer ${this.authToken}` };
    const approvalEndpoints = [
      { path: '/approvals/stats', name: 'Approval Stats' },
      { path: '/approvals/pending', name: 'Pending Reports' },
      { path: '/approvals/my-reports', name: 'My Reports' }
    ];

    let successCount = 0;
    
    for (const endpoint of approvalEndpoints) {
      try {
        const response = await axios.get(`${API_BASE}${endpoint.path}`, { headers });
        if (response.data.success) {
          this.log(`${endpoint.name} - Working correctly`, 'success', 'APPROVAL');
          successCount++;
        } else {
          this.log(`${endpoint.name} - Invalid response structure`, 'warning', 'APPROVAL');
        }
      } catch (error) {
        this.log(`${endpoint.name} - Error: ${error.message}`, 'error', 'APPROVAL');
      }
    }

    const successRate = (successCount / approvalEndpoints.length) * 100;
    this.log(`Approval System Status: ${successCount}/${approvalEndpoints.length} working (${successRate.toFixed(1)}%)`, 
             successRate === 100 ? 'success' : 'warning', 'APPROVAL');
    
    return successRate >= 100;
  }

  async checkDataIntegrity() {
    if (!this.authToken) {
      this.log('Cannot check data integrity without authentication', 'error', 'DATA');
      return false;
    }

    const headers = { Authorization: `Bearer ${this.authToken}` };
    
    try {
      // Check if we have essential data
      const [usersRes, deptsRes, activitiesRes, approvalStatsRes] = await Promise.all([
        axios.get(`${API_BASE}/users`, { headers }),
        axios.get(`${API_BASE}/departments`, { headers }),
        axios.get(`${API_BASE}/activities`, { headers }),
        axios.get(`${API_BASE}/approvals/stats`, { headers })
      ]);

      const userCount = usersRes.data.users ? usersRes.data.users.length : 0;
      const deptCount = deptsRes.data.departments ? deptsRes.data.departments.length : 0;
      const activityCount = activitiesRes.data.activities ? activitiesRes.data.activities.length : 0;
      const approvalStats = approvalStatsRes.data.data ? approvalStatsRes.data.data.summary : {};

      this.log(`Data counts - Users: ${userCount}, Departments: ${deptCount}, Activities: ${activityCount}`, 'info', 'DATA');
      this.log(`Approval data - Total: ${approvalStats.total || 0}, Pending: ${approvalStats.pending || 0}, Approved: ${approvalStats.approved || 0}`, 'info', 'DATA');

      if (userCount > 0 && deptCount > 0) {
        this.log('Essential data is present', 'success', 'DATA');
        return true;
      } else {
        this.log('Missing essential data', 'warning', 'DATA');
        return false;
      }
    } catch (error) {
      this.log(`Data integrity check failed: ${error.message}`, 'error', 'DATA');
      return false;
    }
  }

  generateReport() {
    const categories = ['AUTH', 'API', 'APPROVAL', 'DATA'];
    const summary = {};
    
    categories.forEach(cat => {
      const categoryResults = this.results.filter(r => r.category === cat);
      const total = categoryResults.length;
      const success = categoryResults.filter(r => r.type === 'success').length;
      const errors = categoryResults.filter(r => r.type === 'error').length;
      
      summary[cat] = { total, success, errors, rate: total > 0 ? (success / total * 100).toFixed(1) : '0.0' };
    });

    this.log('\n📊 FINAL SYSTEM STATUS REPORT', 'info', 'SYSTEM');
    this.log('═'.repeat(50), 'info', 'SYSTEM');
    
    Object.entries(summary).forEach(([category, stats]) => {
      const status = stats.errors === 0 && stats.success > 0 ? 'HEALTHY' : stats.errors > 0 ? 'ISSUES' : 'UNKNOWN';
      const statusIcon = status === 'HEALTHY' ? '🟢' : status === 'ISSUES' ? '🟡' : '⚪';
      
      this.log(`${statusIcon} ${category}: ${stats.success}/${stats.total} successful (${stats.rate}%) - ${status}`, 'info', 'SYSTEM');
    });

    const totalSuccess = Object.values(summary).reduce((acc, stats) => acc + stats.success, 0);
    const totalTests = Object.values(summary).reduce((acc, stats) => acc + stats.total, 0);
    const overallRate = totalTests > 0 ? (totalSuccess / totalTests * 100).toFixed(1) : '0.0';
    
    this.log('═'.repeat(50), 'info', 'SYSTEM');
    this.log(`🎯 OVERALL SYSTEM HEALTH: ${totalSuccess}/${totalTests} (${overallRate}%)`, 
             overallRate >= 90 ? 'success' : overallRate >= 70 ? 'warning' : 'error', 'SYSTEM');
    
    if (overallRate >= 90) {
      this.log('🎉 SYSTEM IS FULLY OPERATIONAL AND READY FOR PRODUCTION!', 'success', 'SYSTEM');
    } else if (overallRate >= 70) {
      this.log('⚠️ System is mostly functional but has some issues to address', 'warning', 'SYSTEM');
    } else {
      this.log('❌ System has significant issues that need immediate attention', 'error', 'SYSTEM');
    }
    
    return parseFloat(overallRate);
  }

  async runFullSystemCheck() {
    this.log('🚀 Starting comprehensive dpdPlanner system check...', 'info', 'SYSTEM');
    this.log('Testing all components: Authentication, APIs, Approval System, and Data Integrity', 'info', 'SYSTEM');
    this.log('─'.repeat(70), 'info', 'SYSTEM');

    // Run all checks
    const authOk = await this.checkAuthentication();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const apisOk = await this.checkCoreAPIs();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const approvalOk = await this.checkApprovalSystem();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dataOk = await this.checkDataIntegrity();

    // Generate final report
    const overallHealth = this.generateReport();
    
    return {
      success: overallHealth >= 90,
      health: overallHealth,
      components: { auth: authOk, apis: apisOk, approval: approvalOk, data: dataOk }
    };
  }
}

// Run the comprehensive system check
const checker = new SystemStatusCheck();
checker.runFullSystemCheck().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ System check error:', error.message);
  process.exit(1);
});
